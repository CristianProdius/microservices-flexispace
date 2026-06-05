import { FastifyInstance } from "fastify";
import {
  shouldBeAdmin,
  shouldBeUser,
  shouldBeHost,
} from "@repo/auth-middleware/fastify";
import { prisma, BookingStatus } from "@repo/db";
import { startOfMonth, subMonths, differenceInDays } from "date-fns";
import { CreateBookingSchema } from "@repo/types";
import { producer } from "../utils/kafka.js";

const roundCurrency = (amount: number) => Math.round(amount * 100) / 100;

const BOOKING_STATUSES = new Set<BookingStatus>([
  "PENDING",
  "APPROVED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "EXPIRED",
]);

const parseBookingStatus = (value: unknown) => {
  if (value === undefined || value === null || value === "") return undefined;
  return typeof value === "string" && BOOKING_STATUSES.has(value as BookingStatus)
    ? (value as BookingStatus)
    : null;
};

const parsePositiveInteger = (value: unknown, fallback?: number, max?: number) => {
  if ((value === undefined || value === null || value === "") && fallback !== undefined) {
    return fallback;
  }
  if (typeof value !== "string" && typeof value !== "number") return null;
  const normalized = String(value);
  if (!/^\d+$/.test(normalized)) return null;
  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null;
  return max ? Math.min(parsed, max) : parsed;
};

const dateFromInput = (value: string) => new Date(`${value}T00:00:00.000Z`);

const dateKey = (date: Date) => date.toISOString().slice(0, 10);

const minutesFromTime = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours! * 60 + minutes!;
};

const datesBetweenInclusive = (startDate: Date, endDate: Date) => {
  const dates: Date[] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    dates.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
};

const bookingHours = (
  startDate: Date,
  endDate: Date,
  startTime: string | null,
  endTime: string | null
) => {
  const days = datesBetweenInclusive(startDate, endDate).length;
  if (!startTime || !endTime) return days * 24;
  return ((minutesFromTime(endTime) - minutesFromTime(startTime)) / 60) * days;
};

const validateAvailabilityRules = (
  space: {
    availability?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isOpen: boolean;
    }>;
    blockedDates?: Array<{ date: Date }>;
    minBookingHours: number | null;
    maxBookingHours: number | null;
  },
  startDate: Date,
  endDate: Date,
  startTime: string | null,
  endTime: string | null
) => {
  const requestedDates = datesBetweenInclusive(startDate, endDate);
  const blockedDates = new Set((space.blockedDates ?? []).map((blockedDate) => dateKey(blockedDate.date)));
  if (requestedDates.some((date) => blockedDates.has(dateKey(date)))) {
    return "Some requested dates are blocked";
  }

  if (!space.availability || space.availability.length === 0) {
    return "Space has no availability configured";
  }

  for (const date of requestedDates) {
    const dayAvailability = space.availability.find((item) => item.dayOfWeek === date.getUTCDay());
    if (!dayAvailability || !dayAvailability.isOpen) {
      return "Space is closed on one or more requested dates";
    }

    if (
      startTime &&
      endTime &&
      (minutesFromTime(startTime) < minutesFromTime(dayAvailability.startTime) ||
        minutesFromTime(endTime) > minutesFromTime(dayAvailability.endTime))
    ) {
      return "Booking time is outside availability";
    }
  }

  const hours = bookingHours(startDate, endDate, startTime, endTime);
  if (space.minBookingHours !== null && hours < space.minBookingHours) {
    return `Minimum booking duration is ${space.minBookingHours} hours`;
  }
  if (space.maxBookingHours !== null && hours > space.maxBookingHours) {
    return `Maximum booking duration is ${space.maxBookingHours} hours`;
  }

  return null;
};

const dateRangesOverlap = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
  aStart <= bEnd && aEnd >= bStart;

const bookingIntervalsOverlap = (
  existing: {
    startDate: Date;
    endDate: Date;
    startTime: string | null;
    endTime: string | null;
    isHourly: boolean;
  },
  incoming: {
    startDate: Date;
    endDate: Date;
    startTime: string | null;
    endTime: string | null;
    isHourly: boolean;
  }
) => {
  if (!dateRangesOverlap(existing.startDate, existing.endDate, incoming.startDate, incoming.endDate)) {
    return false;
  }

  if (
    !existing.isHourly ||
    !incoming.isHourly ||
    !existing.startTime ||
    !existing.endTime ||
    !incoming.startTime ||
    !incoming.endTime
  ) {
    return true;
  }

  return (
    minutesFromTime(incoming.startTime) < minutesFromTime(existing.endTime) &&
    minutesFromTime(incoming.endTime) > minutesFromTime(existing.startTime)
  );
};

// Calculate booking price based on space pricing and duration
const calculateBookingPrice = (
  space: {
    pricingType: string;
    pricePerHour: number | null;
    pricePerDay: number | null;
    cleaningFee: number;
    currency: string;
    pricingTiers?: Array<{ minutes: number; price: number }>;
  },
  startDate: Date,
  endDate: Date,
  startTime: string | null,
  endTime: string | null
): { subtotal: number; cleaningFee: number; serviceFee: number; total: number } => {
  let subtotal = 0;

  // Calculate total minutes for the booking
  const days = differenceInDays(endDate, startDate) + 1;
  let totalMinutes = days * 24 * 60; // default to full days
  if (startTime && endTime) {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const minutesPerDay = (endH! - startH!) * 60 + (endM! - startM!);
    totalMinutes = minutesPerDay * days;
  }

  // Pricing tiers use per-block pricing: if a booking spans 300 minutes
  // and the best tier is 240 minutes at $35, charge ceil(300/240) = 2 blocks = $70.
  // This is by design — tiers represent indivisible time blocks.
  let usedTier = false;
  if (space.pricingTiers && space.pricingTiers.length > 0) {
    // Find the best-fit tier: largest tier that fits within totalMinutes
    const eligibleTiers = space.pricingTiers.filter((t) => t.minutes <= totalMinutes);
    if (eligibleTiers.length > 0) {
      const bestTier = eligibleTiers[eligibleTiers.length - 1]!; // already sorted asc
      const units = Math.ceil(totalMinutes / bestTier.minutes);
      subtotal = roundCurrency(units * bestTier.price);
      usedTier = true;
    }
  }

  // Fall back to pricePerHour / pricePerDay if no tier matched
  if (!usedTier) {
    if (space.pricingType === "HOURLY" && space.pricePerHour && startTime && endTime) {
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      const hours = (endH! - startH!) + (endM! - startM!) / 60;
      subtotal = roundCurrency(space.pricePerHour * hours * days);
    } else if (space.pricingType === "DAILY" && space.pricePerDay) {
      subtotal = roundCurrency(space.pricePerDay * days);
    } else if (space.pricingType === "BOTH") {
      // For BOTH, calculate based on what's provided
      if (startTime && endTime && space.pricePerHour) {
        const [startH, startM] = startTime.split(":").map(Number);
        const [endH, endM] = endTime.split(":").map(Number);
        const hours = (endH! - startH!) + (endM! - startM!) / 60;
        subtotal = roundCurrency(space.pricePerHour * hours * days);
      } else if (space.pricePerDay) {
        subtotal = roundCurrency(space.pricePerDay * days);
      }
    }
  }

  const cleaningFee = roundCurrency(space.cleaningFee);
  const serviceFee = roundCurrency(subtotal * 0.1); // 10% service fee
  const total = roundCurrency(subtotal + cleaningFee + serviceFee);

  return { subtotal, cleaningFee, serviceFee, total };
};

async function getExchangeRate(fromCurrency: string): Promise<number> {
  if (fromCurrency === "USD") return 1.0;
  const rate = await prisma.exchangeRate.findUnique({
    where: {
      fromCurrency_toCurrency: {
        fromCurrency: fromCurrency as any,
        toCurrency: "USD" as any,
      },
    },
  });
  if (!rate) {
    console.error(`Exchange rate not configured: ${fromCurrency} -> USD, defaulting to 1.0`);
    return 1.0; // Log error but don't break booking flow
  }
  return Number(rate.rate); // rate.rate is Prisma.Decimal
}

export const bookingRoute = async (fastify: FastifyInstance) => {
  // Create a new booking request (Guest)
  fastify.post(
    "/bookings",
    { preHandler: shouldBeUser },
    async (request, reply) => {
      const guestId = request.userId!;
      const result = CreateBookingSchema.safeParse(request.body);

      if (!result.success) {
        return reply.status(400).send({
          message: "Validation failed",
          errors: result.error.issues,
        });
      }

      const { spaceId, startDate, endDate, startTime, endTime, guests, isHourly, message } = result.data;
      const requestedStartDate = dateFromInput(startDate);
      const requestedEndDate = dateFromInput(endDate);

      // Get space details
      const space = await prisma.space.findUnique({
        where: { id: spaceId },
        include: {
          availability: true,
          blockedDates: true,
          host: true,
          pricingTiers: { orderBy: { minutes: "asc" } },
        },
      });

      if (!space) {
        return reply.status(404).send({ message: "Space not found" });
      }

      if (!space.isActive) {
        return reply.status(400).send({ message: "Space is not available" });
      }

      // Check capacity
      if (guests && guests > space.capacity) {
        return reply.status(400).send({
          message: `Space capacity is ${space.capacity} guests`,
        });
      }

      const availabilityError = validateAvailabilityRules(
        space,
        requestedStartDate,
        requestedEndDate,
        startTime || null,
        endTime || null
      );
      if (availabilityError) {
        return reply.status(400).send({ message: availabilityError });
      }

      // Calculate pricing
      const pricing = calculateBookingPrice(
        space,
        requestedStartDate,
        requestedEndDate,
        startTime || null,
        endTime || null
      );

      const exchangeRate = await getExchangeRate(space.currency);

      // Check for conflicts and create booking in a serializable transaction to prevent race conditions.
      // APPROVED is included even though the current flow goes PENDING -> CONFIRMED directly,
      // because the enum still permits it and any APPROVED-but-not-yet-CONFIRMED booking
      // must reserve its window. EXPIRED bookings are released and intentionally excluded.
      const conflictingStatuses: BookingStatus[] = ["PENDING", "APPROVED", "CONFIRMED"];
      const conflictWhere = {
        spaceId,
        status: {
          in: conflictingStatuses,
        },
        startDate: { lte: requestedEndDate },
        endDate: { gte: requestedStartDate },
      };

      let booking;
      try {
        booking = await prisma.$transaction(async (tx) => {
          const candidateConflicts = await tx.booking.findMany({ where: conflictWhere });
          const conflict = candidateConflicts.find((candidate) =>
            bookingIntervalsOverlap(
              {
                endDate: candidate.endDate,
                endTime: candidate.endTime,
                isHourly: candidate.isHourly,
                startDate: candidate.startDate,
                startTime: candidate.startTime,
              },
              {
                endDate: requestedEndDate,
                endTime: endTime || null,
                isHourly,
                startDate: requestedStartDate,
                startTime: startTime || null,
              }
            )
          );
          if (conflict) throw new Error("CONFLICT");
          return tx.booking.create({
            data: {
              spaceId,
              guestId,
              hostId: space.hostId,
              startDate: requestedStartDate,
              endDate: requestedEndDate,
              startTime,
              endTime,
              guests: guests || 1,
              isHourly,
              status: space.instantBook ? "CONFIRMED" : "PENDING",
              subtotal: pricing.subtotal,
              cleaningFee: pricing.cleaningFee,
              serviceFee: pricing.serviceFee,
              totalAmount: pricing.total,
              guestMessage: message,
              currency: space.currency,
              exchangeRate,
            },
            include: {
              space: {
                include: { host: true },
              },
              guest: {
                select: { id: true, name: true, email: true },
              },
            },
          });
        }, { isolationLevel: 'Serializable' });
      } catch (err: any) {
        if (err.message === "CONFLICT") {
          return reply.status(409).send({
            message: "These dates conflict with an existing booking",
          });
        }
        throw err;
      }

      // Send Kafka event
      producer.send("booking.created", {
        value: {
          bookingId: booking.id,
          spaceId: booking.spaceId,
          guestId: booking.guestId,
          hostId: booking.hostId,
          guestEmail: booking.guest.email,
          hostEmail: booking.space.host.email,
          spaceName: booking.space.name,
          status: booking.status,
        },
      });

      return reply.status(201).send(booking);
    }
  );

  // Get bookings for logged-in guest
  fastify.get(
    "/bookings/my",
    { preHandler: shouldBeUser },
    async (request, reply) => {
      const guestId = request.userId!;
      const { status: statusParam } = request.query as { status?: string };
      const status = parseBookingStatus(statusParam);
      if (status === null) {
        return reply.status(400).send({ message: "Invalid booking status" });
      }

      const bookings = await prisma.booking.findMany({
        where: {
          guestId,
          ...(status && { status }),
        },
        include: {
          space: {
            include: {
              host: {
                select: { id: true, name: true, image: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return reply.send(bookings);
    }
  );

  // Get bookings for host's spaces
  fastify.get(
    "/bookings/host",
    { preHandler: shouldBeHost },
    async (request, reply) => {
      const hostId = request.userId!;
      const { status, spaceId } = request.query as {
        status?: string;
        spaceId?: string;
      };
      const parsedStatus = parseBookingStatus(status);
      if (parsedStatus === null) {
        return reply.status(400).send({ message: "Invalid booking status" });
      }

      const spaceIdFilter = spaceId ? parsePositiveInteger(spaceId) : undefined;
      if (spaceIdFilter === null) {
        return reply.status(400).send({ message: "spaceId must be a positive integer" });
      }

      const bookings = await prisma.booking.findMany({
        where: {
          hostId,
          ...(parsedStatus && { status: parsedStatus }),
          ...(spaceIdFilter !== undefined && { spaceId: spaceIdFilter }),
        },
        include: {
          space: true,
          guest: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return reply.send(bookings);
    }
  );

  // Get single booking
  fastify.get(
    "/bookings/:id",
    { preHandler: shouldBeUser },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.userId!;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          space: {
            include: {
              amenities: { include: { amenity: true } },
            },
          },
          guest: {
            select: { id: true, name: true, email: true, image: true },
          },
          host: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });

      if (!booking) {
        return reply.status(404).send({ message: "Booking not found" });
      }

      // Check access
      const userRole = request.user?.role;
      if (
        booking.guestId !== userId &&
        booking.hostId !== userId &&
        userRole !== "ADMIN"
      ) {
        return reply.status(403).send({ message: "Not authorized" });
      }

      return reply.send(booking);
    }
  );

  // Approve booking (Host)
  fastify.put(
    "/bookings/:id/approve",
    { preHandler: shouldBeHost },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const hostId = request.userId!;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          space: true,
          guest: { select: { email: true, name: true } },
        },
      });

      if (!booking) {
        return reply.status(404).send({ message: "Booking not found" });
      }

      if (booking.hostId !== hostId && request.user?.role !== "ADMIN") {
        return reply.status(403).send({ message: "Not authorized" });
      }

      if (booking.status !== "PENDING") {
        return reply.status(400).send({
          message: `Cannot approve booking with status ${booking.status}`,
        });
      }

      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: { status: "CONFIRMED" },
        include: { space: true, guest: true },
      });

      producer.send("booking.approved", {
        value: {
          bookingId: id,
          guestEmail: booking.guest.email,
          guestName: booking.guest.name,
          spaceName: booking.space.name,
        },
      });

      return reply.send(updatedBooking);
    }
  );

  // Reject booking (Host)
  fastify.put(
    "/bookings/:id/reject",
    { preHandler: shouldBeHost },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const hostId = request.userId!;
      const { reason } = request.body as { reason?: string };

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { space: true, guest: { select: { email: true } } },
      });

      if (!booking) {
        return reply.status(404).send({ message: "Booking not found" });
      }

      if (booking.hostId !== hostId && request.user?.role !== "ADMIN") {
        return reply.status(403).send({ message: "Not authorized" });
      }

      if (booking.status !== "PENDING") {
        return reply.status(400).send({
          message: `Cannot reject booking with status ${booking.status}`,
        });
      }

      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: "REJECTED",
          hostMessage: reason,
        },
      });

      producer.send("booking.rejected", {
        value: {
          bookingId: id,
          guestEmail: booking.guest.email,
          spaceName: booking.space.name,
          reason,
        },
      });

      return reply.send(updatedBooking);
    }
  );

  // Cancel booking (Guest or Host)
  fastify.post(
    "/bookings/:id/cancel",
    { preHandler: shouldBeUser },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const userId = request.userId!;
      const { reason } = request.body as { reason?: string };

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          space: true,
          guest: { select: { email: true, name: true } },
          host: { select: { email: true, name: true } },
        },
      });

      if (!booking) {
        return reply.status(404).send({ message: "Booking not found" });
      }

      const isGuest = booking.guestId === userId;
      const isHost = booking.hostId === userId;
      const isAdmin = request.user?.role === "ADMIN";

      if (!isGuest && !isHost && !isAdmin) {
        return reply.status(403).send({ message: "Not authorized" });
      }

      const cancellableStatuses: BookingStatus[] = ["PENDING", "CONFIRMED"];
      if (!cancellableStatuses.includes(booking.status)) {
        return reply.status(400).send({
          message: `Cannot cancel booking with status ${booking.status}`,
        });
      }

      const actor = isGuest ? "GUEST" : isHost ? "HOST" : "ADMIN";
      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelledByRole: actor,
          cancellationReason: reason,
        },
      });

      producer.send("booking.cancelled", {
        value: {
          bookingId: id,
          cancelledByRole: actor,
          guestEmail: booking.guest.email,
          guestName: booking.guest.name,
          hostEmail: booking.host.email,
          hostName: booking.host.name,
          spaceName: booking.space.name,
          reason,
        },
      });

      return reply.send(updatedBooking);
    }
  );

  // Mark booking as completed (Host)
  fastify.put(
    "/bookings/:id/complete",
    { preHandler: shouldBeHost },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const hostId = request.userId!;

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { space: true, guest: { select: { email: true } } },
      });

      if (!booking) {
        return reply.status(404).send({ message: "Booking not found" });
      }

      if (booking.hostId !== hostId && request.user?.role !== "ADMIN") {
        return reply.status(403).send({ message: "Not authorized" });
      }

      if (booking.status !== "CONFIRMED") {
        return reply.status(400).send({
          message: "Booking must be confirmed to be completed",
        });
      }

      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      producer.send("booking.completed", {
        value: {
          bookingId: id,
          guestEmail: booking.guest.email,
          spaceName: booking.space.name,
          hostId: booking.hostId,
          totalAmount: booking.totalAmount,
        },
      });

      return reply.send(updatedBooking);
    }
  );

  // Get all bookings (Admin)
  fastify.get(
    "/bookings",
    { preHandler: shouldBeAdmin },
    async (request, reply) => {
      const { status, limit, page = 1 } = request.query as {
        status?: string;
        limit?: string;
        page?: string;
      };
      const parsedStatus = parseBookingStatus(status);
      if (parsedStatus === null) {
        return reply.status(400).send({ message: "Invalid booking status" });
      }

      const take = parsePositiveInteger(limit, 20, 100);
      const pageNumber = parsePositiveInteger(page, 1);
      if (take === null || pageNumber === null) {
        return reply.status(400).send({ message: "Invalid pagination" });
      }
      const skip = (pageNumber - 1) * take;
      const where = parsedStatus ? { status: parsedStatus } : undefined;

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where,
          take,
          skip,
          orderBy: { createdAt: "desc" },
          include: {
            space: true,
            guest: { select: { id: true, name: true, email: true } },
            host: { select: { id: true, name: true, email: true } },
          },
        }),
        prisma.booking.count({ where }),
      ]);

      return reply.send({
        bookings,
        pagination: {
          page: pageNumber,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    }
  );

  // Get booking stats (Admin)
  fastify.get(
    "/bookings/stats",
    { preHandler: shouldBeAdmin },
    async (request, reply) => {
      const now = new Date();
      const sixMonthsAgo = startOfMonth(subMonths(now, 5));

      const [
        totalBookings,
        pendingBookings,
        completedBookings,
        totalRevenue,
        monthlyData,
      ] = await Promise.all([
        prisma.booking.count(),
        prisma.booking.count({ where: { status: "PENDING" } }),
        prisma.booking.count({ where: { status: "COMPLETED" } }),
        prisma.booking.aggregate({
          where: { status: "COMPLETED" },
          _sum: { totalAmount: true },
        }),
        prisma.booking.findMany({
          where: { createdAt: { gte: sixMonthsAgo } },
          select: { createdAt: true, status: true, totalAmount: true },
        }),
      ]);

      // Group by month
      const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December",
      ];

      const chartData = [];
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        const year = d.getFullYear();
        const month = d.getMonth();

        const monthBookings = monthlyData.filter((b) => {
          const bDate = new Date(b.createdAt);
          return bDate.getFullYear() === year && bDate.getMonth() === month;
        });

        chartData.push({
          month: monthNames[month],
          total: monthBookings.length,
          completed: monthBookings.filter((b) => b.status === "COMPLETED").length,
          revenue: monthBookings
            .filter((b) => b.status === "COMPLETED")
            .reduce((sum, b) => sum + b.totalAmount, 0),
        });
      }

      return reply.send({
        totalBookings,
        pendingBookings,
        completedBookings,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        chartData,
      });
    }
  );

  // Host earnings
  fastify.get(
    "/bookings/host/earnings",
    { preHandler: shouldBeHost },
    async (request, reply) => {
      const hostId = request.userId!;

      const [completedBookings, pendingPayouts, earnings] = await Promise.all([
        prisma.booking.findMany({
          where: {
            hostId,
            status: "COMPLETED",
          },
          select: {
            totalAmount: true,
            serviceFee: true,
          },
        }),
        prisma.payout.aggregate({
          where: {
            hostId,
            status: { in: ["PENDING", "PROCESSING"] },
          },
          _sum: { netAmount: true },
        }),
        prisma.payout.aggregate({
          where: {
            hostId,
            status: "COMPLETED",
          },
          _sum: { netAmount: true },
        }),
      ]);

      const totalEarnings = completedBookings.reduce(
        (sum, b) => sum + b.totalAmount - b.serviceFee,
        0
      );
      const platformFees = completedBookings.reduce((sum, b) => sum + b.serviceFee, 0);

      return reply.send({
        totalEarnings,
        pendingPayout: pendingPayouts._sum.netAmount || 0,
        completedPayouts: earnings._sum.netAmount || 0,
        platformFees,
      });
    }
  );
};
