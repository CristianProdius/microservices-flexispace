import { FastifyInstance } from "fastify";
import {
  shouldBeAdmin,
  shouldBeUser,
  shouldBeHost,
} from "@repo/auth-middleware/fastify";
import { prisma, BookingStatus } from "@repo/db";
import { startOfMonth, subMonths, differenceInHours, differenceInDays } from "date-fns";
import { CreateBookingSchema } from "@repo/types";
import { producer } from "../utils/kafka.js";

// Calculate booking price based on space pricing and duration
const calculateBookingPrice = (
  space: {
    pricingType: string;
    pricePerHour: number | null;
    pricePerDay: number | null;
    cleaningFee: number;
  },
  startDate: Date,
  endDate: Date,
  startTime: string | null,
  endTime: string | null
): { subtotal: number; cleaningFee: number; serviceFee: number; total: number } => {
  let subtotal = 0;

  if (space.pricingType === "HOURLY" && space.pricePerHour && startTime && endTime) {
    // Calculate hours
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const hours = (endH! - startH!) + (endM! - startM!) / 60;
    const days = differenceInDays(endDate, startDate) + 1;
    subtotal = Math.round(space.pricePerHour * hours * days);
  } else if (space.pricingType === "DAILY" && space.pricePerDay) {
    const days = differenceInDays(endDate, startDate) + 1;
    subtotal = space.pricePerDay * days;
  } else if (space.pricingType === "BOTH") {
    // For BOTH, calculate based on what's provided
    if (startTime && endTime && space.pricePerHour) {
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      const hours = (endH! - startH!) + (endM! - startM!) / 60;
      const days = differenceInDays(endDate, startDate) + 1;
      subtotal = Math.round(space.pricePerHour * hours * days);
    } else if (space.pricePerDay) {
      const days = differenceInDays(endDate, startDate) + 1;
      subtotal = space.pricePerDay * days;
    }
  }

  const cleaningFee = space.cleaningFee;
  const serviceFee = Math.round(subtotal * 0.1); // 10% service fee
  const total = subtotal + cleaningFee + serviceFee;

  return { subtotal, cleaningFee, serviceFee, total };
};

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
          errors: result.error.errors,
        });
      }

      const { spaceId, startDate, endDate, startTime, endTime, guests, message } = result.data;

      // Get space details
      const space = await prisma.space.findUnique({
        where: { id: spaceId },
        include: { host: true },
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

      // Check for conflicting bookings
      const conflictingBooking = await prisma.booking.findFirst({
        where: {
          spaceId,
          status: {
            in: ["PENDING", "APPROVED", "DEPOSIT_PAID"],
          },
          startDate: { lte: new Date(endDate) },
          endDate: { gte: new Date(startDate) },
        },
      });

      if (conflictingBooking) {
        return reply.status(400).send({
          message: "These dates conflict with an existing booking",
        });
      }

      // Calculate pricing
      const pricing = calculateBookingPrice(
        space,
        new Date(startDate),
        new Date(endDate),
        startTime || null,
        endTime || null
      );

      const depositAmount = Math.round(pricing.total * 0.3); // 30% deposit
      const remainingAmount = pricing.total - depositAmount;

      // Create booking
      const booking = await prisma.booking.create({
        data: {
          spaceId,
          guestId,
          hostId: space.hostId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          startTime,
          endTime,
          guests: guests || 1,
          status: space.instantBook ? "APPROVED" : "PENDING",
          subtotal: pricing.subtotal,
          cleaningFee: pricing.cleaningFee,
          serviceFee: pricing.serviceFee,
          totalAmount: pricing.total,
          depositAmount,
          remainingAmount,
          guestMessage: message,
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
      const { status } = request.query as { status?: BookingStatus };

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
        status?: BookingStatus;
        spaceId?: string;
      };

      const bookings = await prisma.booking.findMany({
        where: {
          hostId,
          ...(status && { status }),
          ...(spaceId && { spaceId }),
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
              host: {
                select: { id: true, name: true, email: true, image: true },
              },
              amenities: { include: { amenity: true } },
            },
          },
          guest: {
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
        data: { status: "APPROVED" },
        include: { space: true, guest: true },
      });

      producer.send("booking.approved", {
        value: {
          bookingId: id,
          guestEmail: booking.guest.email,
          guestName: booking.guest.name,
          spaceName: booking.space.name,
          depositAmount: booking.depositAmount,
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
        include: { space: true },
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

      const cancellableStatuses: BookingStatus[] = ["PENDING", "APPROVED", "DEPOSIT_PAID"];
      if (!cancellableStatuses.includes(booking.status)) {
        return reply.status(400).send({
          message: `Cannot cancel booking with status ${booking.status}`,
        });
      }

      // Calculate refund based on cancellation policy
      let refundAmount = 0;
      if (booking.depositPaid) {
        const policy = booking.space.cancellationPolicy;
        const daysUntilBooking = differenceInDays(booking.startDate, new Date());

        if (policy === "FLEXIBLE" || daysUntilBooking >= 7) {
          refundAmount = booking.depositAmount; // Full refund
        } else if (policy === "MODERATE" && daysUntilBooking >= 3) {
          refundAmount = Math.round(booking.depositAmount * 0.5); // 50% refund
        } else if (policy === "STRICT") {
          refundAmount = 0; // No refund
        }
        // NON_REFUNDABLE = 0
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
          refundAmount,
        },
      });

      return reply.send({ ...updatedBooking, refundAmount });
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

      if (booking.status !== "DEPOSIT_PAID") {
        return reply.status(400).send({
          message: "Booking must have deposit paid to be completed",
        });
      }

      // Check if remaining payment is made (or if it's $0)
      if (!booking.remainingPaid && booking.remainingAmount > 0) {
        return reply.status(400).send({
          message: "Remaining payment must be made before completing",
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
        status?: BookingStatus;
        limit?: string;
        page?: string;
      };

      const take = limit ? Number(limit) : 20;
      const skip = (Number(page) - 1) * take;

      const [bookings, total] = await Promise.all([
        prisma.booking.findMany({
          where: status ? { status } : undefined,
          take,
          skip,
          orderBy: { createdAt: "desc" },
          include: {
            space: true,
            guest: { select: { id: true, name: true, email: true } },
            host: { select: { id: true, name: true, email: true } },
          },
        }),
        prisma.booking.count({ where: status ? { status } : undefined }),
      ]);

      return reply.send({
        bookings,
        pagination: {
          page: Number(page),
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
