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

// BOOKSVC-008: pragmatic mitigation against Float64 drift in monetary math.
// Long-term fix is to migrate monetary columns to Decimal(12,2) (tracked as
// DB-001). Until then, round to cents at every assignment boundary so totals
// stay coherent with line items and downstream aggregates don't accumulate
// sub-cent error (e.g. 0.1 + 0.2 = 0.30000000000000004).
export const round2 = (n: number): number => Math.round(n * 100) / 100;

// Retained alias used in pricing math below.
const roundCurrency = round2;

// BOOKSVC-007: typed error thrown when an ExchangeRate row is missing for a
// (from, to) pair. Callers MUST surface this to the user instead of silently
// substituting 1.0, which previously caused 18x under-reporting on USD↔MDL.
export class MissingExchangeRateError extends Error {
  readonly fromCurrency: string;
  readonly toCurrency: string;
  constructor(fromCurrency: string, toCurrency: string) {
    super(`Exchange rate not configured: ${fromCurrency} -> ${toCurrency}`);
    this.name = "MissingExchangeRateError";
    this.fromCurrency = fromCurrency;
    this.toCurrency = toCurrency;
  }
}

// BOOKSVC-004: refund-rate matrix applied at cancel time. Returns the fraction
// (0..1) of totalAmount to refund based on the space's cancellation policy and
// hours remaining until check-in.
//   FLEXIBLE       : 100% if >24h, else 0%
//   MODERATE       : 100% if >5d (120h), 50% if 24h–5d, else 0%
//   STRICT         : 50% if >7d (168h), else 0%
//   NON_REFUNDABLE : always 0%
// (Schema defaults policies to MODERATE.)
export const computeRefundRate = (
  policy: "FLEXIBLE" | "MODERATE" | "STRICT" | "NON_REFUNDABLE",
  hoursUntilCheckin: number
): number => {
  if (policy === "NON_REFUNDABLE") return 0;
  if (policy === "FLEXIBLE") return hoursUntilCheckin > 24 ? 1 : 0;
  if (policy === "MODERATE") {
    if (hoursUntilCheckin > 120) return 1;
    if (hoursUntilCheckin > 24) return 0.5;
    return 0;
  }
  // STRICT
  return hoursUntilCheckin > 168 ? 0.5 : 0;
};

// BOOKSVC-006: compute UTC-based [start, end) bounds for "today"/"week"/"month"
// in a caller-supplied IANA timezone. Uses Intl.DateTimeFormat parts to avoid a
// new dependency. If the tz string is invalid, falls back to UTC.
export const getTzPeriodBounds = (
  now: Date,
  tz: string
): { todayStart: Date; weekStart: Date; monthStart: Date } => {
  let parts: Intl.DateTimeFormatPart[];
  try {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      weekday: "short",
    }).formatToParts(now);
  } catch {
    parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      weekday: "short",
    }).formatToParts(now);
  }
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  const year = Number(pick("year"));
  const month = Number(pick("month"));
  const day = Number(pick("day"));
  let hour = Number(pick("hour"));
  if (hour === 24) hour = 0; // Some locales report 24:00 instead of 00:00.
  const minute = Number(pick("minute"));
  const second = Number(pick("second"));
  const weekdayShort = pick("weekday");
  const weekdayIndex = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ].indexOf(weekdayShort);

  // Compute wall-clock midnight in tz by subtracting the elapsed seconds today.
  const elapsedMs =
    (hour * 3600 + minute * 60 + second) * 1000 +
    (now.getTime() % 1000);
  const todayStart = new Date(now.getTime() - elapsedMs);

  const daysSinceMonday = weekdayIndex >= 0 ? (weekdayIndex + 6) % 7 : 0;
  const weekStart = new Date(
    todayStart.getTime() - daysSinceMonday * 86_400_000
  );

  const monthStart = new Date(
    todayStart.getTime() - (day - 1) * 86_400_000
  );
  // Sanity reference (year/month unused after computation but kept to make the
  // intent obvious to future readers).
  void year;
  void month;

  return { todayStart, weekStart, monthStart };
};

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

// BOOKSVC-007: never default to 1.0 when an exchange rate is missing — that
// silently under-reports cross-currency bookings (e.g. USD↔MDL by ~18x).
// Throw a typed error so the caller can return 503 / show "rate unavailable".
async function getExchangeRate(
  fromCurrency: string,
  toCurrency: string = "USD"
): Promise<number> {
  if (fromCurrency === toCurrency) return 1.0;
  const rate = await prisma.exchangeRate.findUnique({
    where: {
      fromCurrency_toCurrency: {
        fromCurrency: fromCurrency as any,
        toCurrency: toCurrency as any,
      },
    },
  });
  if (!rate) {
    throw new MissingExchangeRateError(fromCurrency, toCurrency);
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

      let exchangeRate: number;
      try {
        exchangeRate = await getExchangeRate(space.currency);
      } catch (err) {
        if (err instanceof MissingExchangeRateError) {
          return reply.status(503).send({
            message: `Exchange rate unavailable for ${err.fromCurrency} -> ${err.toCurrency}`,
          });
        }
        throw err;
      }

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

      // BOOKSVC-004: apply the space's cancellation policy. Previously the
      // handler set status=CANCELLED unconditionally, so guests could cancel
      // minutes before check-in and avoid any payment retention. We now
      // compute the refund rate based on policy + hours-until-checkin.
      //
      // Host- and admin-initiated cancellations always refund 100% (the guest
      // is not at fault). Pending bookings — which have not been confirmed by
      // the host — also refund 100%. Policy enforcement only applies when a
      // GUEST cancels a CONFIRMED booking.
      //
      // refundAmount is NOT persisted on the Booking model (no column exists
      // and adding one would conflict with sibling DB branches in flight). We
      // return it in the response and emit it on the kafka event so the
      // payment-service can act on it; long-term it should become a column.
      const cancelledBy = isGuest ? "GUEST" : isHost ? "HOST" : "ADMIN";
      const now = new Date();
      const policy = booking.space.cancellationPolicy as
        | "FLEXIBLE"
        | "MODERATE"
        | "STRICT"
        | "NON_REFUNDABLE";

      // startDate is the day-of-checkin; if startTime is present, combine to
      // get an accurate hours-until-checkin estimate.
      let checkinAt = new Date(booking.startDate);
      if (booking.startTime) {
        const [h, m] = booking.startTime.split(":").map(Number);
        checkinAt = new Date(checkinAt);
        checkinAt.setUTCHours(h ?? 0, m ?? 0, 0, 0);
      }
      const hoursUntilCheckin = (checkinAt.getTime() - now.getTime()) / 3_600_000;

      let refundRate: number;
      if (cancelledBy !== "GUEST" || booking.status === "PENDING") {
        refundRate = 1;
      } else {
        refundRate = computeRefundRate(policy, hoursUntilCheckin);
      }
      const refundAmount = round2(booking.totalAmount * refundRate);

      const updatedBooking = await prisma.booking.update({
        where: { id },
        data: {
          status: "CANCELLED",
          cancelledAt: now,
          cancelledBy,
          cancellationReason: reason,
        },
      });

      producer.send("booking.cancelled", {
        value: {
          bookingId: id,
          cancelledBy,
          guestEmail: booking.guest.email,
          guestName: booking.guest.name,
          hostEmail: booking.host.email,
          hostName: booking.host.name,
          spaceName: booking.space.name,
          reason,
          cancellationPolicy: policy,
          hoursUntilCheckin: round2(hoursUntilCheckin),
          refundRate,
          refundAmount,
          currency: booking.currency,
        },
      });

      return reply.send({
        ...updatedBooking,
        refund: {
          policy,
          rate: refundRate,
          amount: refundAmount,
          currency: booking.currency,
          hoursUntilCheckin: round2(hoursUntilCheckin),
        },
      });
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
      const { tz: tzParam } = request.query as { tz?: string };
      const tz = typeof tzParam === "string" && tzParam.length > 0 ? tzParam : "UTC";

      const now = new Date();
      const sixMonthsAgo = startOfMonth(subMonths(now, 5));

      // BOOKSVC-006: bucket boundaries should follow the admin's tz, not the
      // server's local clock. The chartData below still buckets by UTC month to
      // stay stable across deploys, but `todayStart`/`weekStart`/`monthStart`
      // surface tz-aware bounds for the dashboard's "today / this week / this
      // month" tiles.
      const { todayStart, weekStart, monthStart } = getTzPeriodBounds(now, tz);

      const [
        totalBookings,
        pendingBookings,
        completedBookings,
        revenueByCurrency,
        monthlyData,
        revenueTodayByCurrency,
        revenueThisWeekByCurrency,
        revenueThisMonthByCurrency,
      ] = await Promise.all([
        prisma.booking.count(),
        prisma.booking.count({ where: { status: "PENDING" } }),
        prisma.booking.count({ where: { status: "COMPLETED" } }),
        // BOOKSVC-006 (+005): group by currency so admins never see
        // meaningless cross-currency sums.
        prisma.booking.groupBy({
          by: ["currency"],
          where: { status: "COMPLETED" },
          _sum: { totalAmount: true },
        }),
        prisma.booking.findMany({
          where: { createdAt: { gte: sixMonthsAgo } },
          select: { createdAt: true, status: true, totalAmount: true, currency: true },
        }),
        prisma.booking.groupBy({
          by: ["currency"],
          where: { status: "COMPLETED", completedAt: { gte: todayStart } },
          _sum: { totalAmount: true },
        }),
        prisma.booking.groupBy({
          by: ["currency"],
          where: { status: "COMPLETED", completedAt: { gte: weekStart } },
          _sum: { totalAmount: true },
        }),
        prisma.booking.groupBy({
          by: ["currency"],
          where: { status: "COMPLETED", completedAt: { gte: monthStart } },
          _sum: { totalAmount: true },
        }),
      ]);

      const groupRowsToTotals = (
        rows: Array<{ currency: string; _sum: { totalAmount: number | null } }>
      ) =>
        rows.map((row) => ({
          currency: row.currency,
          total: round2(row._sum.totalAmount ?? 0),
        }));

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

        // Build revenue per currency for this month bucket.
        const revenueByCurrencyForMonth = new Map<string, number>();
        for (const b of monthBookings) {
          if (b.status !== "COMPLETED") continue;
          const prev = revenueByCurrencyForMonth.get(b.currency) ?? 0;
          revenueByCurrencyForMonth.set(b.currency, prev + b.totalAmount);
        }

        chartData.push({
          month: monthNames[month],
          total: monthBookings.length,
          completed: monthBookings.filter((b) => b.status === "COMPLETED").length,
          revenueByCurrency: Array.from(revenueByCurrencyForMonth.entries()).map(
            ([currency, total]) => ({ currency, total: round2(total) })
          ),
        });
      }

      return reply.send({
        timezone: tz,
        totalBookings,
        pendingBookings,
        completedBookings,
        revenueByCurrency: groupRowsToTotals(
          revenueByCurrency as Array<{ currency: string; _sum: { totalAmount: number | null } }>
        ),
        revenueToday: groupRowsToTotals(
          revenueTodayByCurrency as Array<{ currency: string; _sum: { totalAmount: number | null } }>
        ),
        revenueThisWeek: groupRowsToTotals(
          revenueThisWeekByCurrency as Array<{ currency: string; _sum: { totalAmount: number | null } }>
        ),
        revenueThisMonth: groupRowsToTotals(
          revenueThisMonthByCurrency as Array<{ currency: string; _sum: { totalAmount: number | null } }>
        ),
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

      // BOOKSVC-005: aggregate by currency so we never produce meaningless
      // mixed-currency totals like "USD 100 + MDL 1800 = 1900".
      const [completedByCurrency, pendingPayouts, earnings] = await Promise.all([
        prisma.booking.groupBy({
          by: ["currency"],
          where: {
            hostId,
            status: "COMPLETED",
          },
          _sum: {
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

      const earningsByCurrency = completedByCurrency.map((row) => {
        const total = row._sum.totalAmount ?? 0;
        const fees = row._sum.serviceFee ?? 0;
        return {
          currency: row.currency,
          totalEarnings: round2(total - fees),
          platformFees: round2(fees),
          grossRevenue: round2(total),
        };
      });

      return reply.send({
        earningsByCurrency,
        // Payouts are denominated in a single currency (USD per Payout model);
        // surface them separately rather than mixing with multi-currency totals.
        pendingPayout: round2(pendingPayouts._sum.netAmount || 0),
        completedPayouts: round2(earnings._sum.netAmount || 0),
      });
    }
  );
};
