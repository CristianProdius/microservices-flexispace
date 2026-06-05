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

export class InvalidParameterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidParameterError";
  }
}

/**
 * Parses `value` as a positive integer.
 *
 * BOOKSVC-016: distinguish "absent" from "invalid".
 *   - absent (undefined/null/"") -> returns `fallback` (which may itself be undefined)
 *   - present-but-invalid (non-numeric, negative, zero, non-integer, unsafe) -> throws
 *     InvalidParameterError. Callers convert to HTTP 400.
 *   - valid positive integer -> returns the number, clamped to `max` when provided.
 */
export const parsePositiveInteger = (
  value: unknown,
  fallback?: number,
  max?: number
): number | undefined => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  if (typeof value !== "string" && typeof value !== "number") {
    throw new InvalidParameterError("Expected a positive integer");
  }
  const normalized = String(value);
  if (!/^\d+$/.test(normalized)) {
    throw new InvalidParameterError("Expected a positive integer");
  }
  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new InvalidParameterError("Expected a positive integer");
  }
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

/**
 * BOOKSVC-010: single source of truth for "hours per day" used by both
 * validation (bookingHours) and pricing (calculateBookingPrice).
 *
 * Returns the number of hours occupied between startTime and endTime on a
 * single day. If either time is missing, the booking is treated as a full
 * 24-hour day. Handles midnight-crossing (endTime <= startTime) by treating
 * the booking as continuing into the following day.
 */
export const computeBookingHours = (
  startTime: string | null,
  endTime: string | null
): number => {
  if (!startTime || !endTime) return 24;
  let minutes = minutesFromTime(endTime) - minutesFromTime(startTime);
  if (minutes <= 0) minutes += 24 * 60; // cross-midnight
  return minutes / 60;
};

export const bookingHours = (
  startDate: Date,
  endDate: Date,
  startTime: string | null,
  endTime: string | null
) => {
  const days = datesBetweenInclusive(startDate, endDate).length;
  return days * computeBookingHours(startTime, endTime);
};

/**
 * BOOKSVC-014: build an absolute UTC [start, end) interval for a booking so
 * the same overlap predicate works for hourly, daily, and midnight-crossing
 * bookings. End is exclusive.
 *
 * For full-day bookings: [startDate 00:00, endDate + 1 day 00:00).
 * For hourly bookings:   [startDate + startTime, endDate + endTime); if the
 * hourly window crosses midnight (endTime <= startTime) the end is rolled
 * forward by an extra day so the interval stays well-formed.
 */
const bookingInstantRange = (booking: {
  startDate: Date;
  endDate: Date;
  startTime: string | null;
  endTime: string | null;
  isHourly: boolean;
}): { start: Date; end: Date } => {
  if (!booking.isHourly || !booking.startTime || !booking.endTime) {
    const start = new Date(booking.startDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(booking.endDate);
    end.setUTCHours(0, 0, 0, 0);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
  }

  const startMinutes = minutesFromTime(booking.startTime);
  const endMinutes = minutesFromTime(booking.endTime);

  const start = new Date(booking.startDate);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCMinutes(startMinutes);

  const end = new Date(booking.endDate);
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCMinutes(endMinutes);
  if (endMinutes <= startMinutes) {
    // Cross-midnight hourly window: roll end forward by one day.
    end.setUTCDate(end.getUTCDate() + 1);
  }

  return { start, end };
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

/**
 * BOOKSVC-013: half-open overlap predicate. Both ends are EXCLUSIVE so
 * back-to-back intervals (a.end === b.start) do NOT overlap.
 *
 * Callers must pass exclusive-end timestamps. For booking ranges, build them
 * via `bookingInstantRange`.
 */
export const dateRangesOverlap = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
  aStart < bEnd && bStart < aEnd;

export const bookingIntervalsOverlap = (
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
  const existingRange = bookingInstantRange(existing);
  const incomingRange = bookingInstantRange(incoming);
  return dateRangesOverlap(
    existingRange.start,
    existingRange.end,
    incomingRange.start,
    incomingRange.end
  );
};

/**
 * BOOKSVC-009: for HOURLY (and BOTH-as-hourly) pricing on multi-day bookings,
 * each day in the range may have a different availability window. The
 * requested [startTime, endTime] window is intersected with that day's
 * availability before being charged, so a Mon 9-18 + Tue 9-12 booking is only
 * charged 9 hours for Monday and 3 hours for Tuesday.
 *
 * If a day has no availability or is closed, contributes 0 hours (validation
 * would normally have already rejected this).
 */
const billableHourlyHours = (
  availability: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isOpen: boolean;
  }> | undefined,
  startDate: Date,
  endDate: Date,
  startTime: string,
  endTime: string
): number => {
  const requestedStart = minutesFromTime(startTime);
  const requestedEnd = minutesFromTime(endTime);
  if (requestedEnd <= requestedStart) {
    // Cross-midnight or zero-length: fall back to the simple per-day duration.
    // Validation rejects this case via CreateBookingSchema, so this is defensive.
    return datesBetweenInclusive(startDate, endDate).length *
      computeBookingHours(startTime, endTime);
  }

  let totalHours = 0;
  for (const date of datesBetweenInclusive(startDate, endDate)) {
    const day = availability?.find(
      (item) => item.dayOfWeek === date.getUTCDay() && item.isOpen
    );
    if (!day) continue;
    const windowStart = Math.max(requestedStart, minutesFromTime(day.startTime));
    const windowEnd = Math.min(requestedEnd, minutesFromTime(day.endTime));
    if (windowEnd > windowStart) {
      totalHours += (windowEnd - windowStart) / 60;
    }
  }
  return totalHours;
};

// Calculate booking price based on space pricing and duration
export const calculateBookingPrice = (
  space: {
    pricingType: string;
    pricePerHour: number | null;
    pricePerDay: number | null;
    cleaningFee: number;
    currency: string;
    pricingTiers?: Array<{ minutes: number; price: number }>;
    availability?: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      isOpen: boolean;
    }>;
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
    // BOOKSVC-010: share the hours-per-day formula with validation.
    const hoursPerDay = computeBookingHours(startTime, endTime);
    totalMinutes = Math.round(hoursPerDay * 60) * days;
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
      // BOOKSVC-009: per-day intersection with availability windows.
      const hours = billableHourlyHours(
        space.availability,
        startDate,
        endDate,
        startTime,
        endTime
      );
      subtotal = roundCurrency(space.pricePerHour * hours);
    } else if (space.pricingType === "DAILY" && space.pricePerDay) {
      subtotal = roundCurrency(space.pricePerDay * days);
    } else if (space.pricingType === "BOTH") {
      // For BOTH, calculate based on what's provided
      if (startTime && endTime && space.pricePerHour) {
        // BOOKSVC-009: per-day intersection here too.
        const hours = billableHourlyHours(
          space.availability,
          startDate,
          endDate,
          startTime,
          endTime
        );
        subtotal = roundCurrency(space.pricePerHour * hours);
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
  return rate.rate;
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

      // Check for conflicts and create booking in a serializable transaction to prevent race conditions
      const conflictingStatuses: BookingStatus[] = ["PENDING", "CONFIRMED"];
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

      let spaceIdFilter: number | undefined;
      try {
        spaceIdFilter = parsePositiveInteger(spaceId);
      } catch (err) {
        if (err instanceof InvalidParameterError) {
          return reply.status(400).send({ message: "spaceId must be a positive integer" });
        }
        throw err;
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

      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelledBy: isGuest ? "GUEST" : isHost ? "HOST" : "ADMIN",
          cancellationReason: reason,
        },
      });

      producer.send("booking.cancelled", {
        value: {
          bookingId: id,
          cancelledBy: isGuest ? "GUEST" : isHost ? "HOST" : "ADMIN",
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

      let take: number;
      let pageNumber: number;
      try {
        // Both calls have a fallback so they always return a number.
        take = parsePositiveInteger(limit, 20, 100)!;
        pageNumber = parsePositiveInteger(page, 1)!;
      } catch (err) {
        if (err instanceof InvalidParameterError) {
          return reply.status(400).send({ message: "Invalid pagination" });
        }
        throw err;
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
