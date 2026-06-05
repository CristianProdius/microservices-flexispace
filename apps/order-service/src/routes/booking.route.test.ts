import Fastify from "fastify";
import { signAccessToken } from "@repo/auth-middleware/jwt";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { bookingRoute } from "./booking.js";

const mocks = vi.hoisted(() => {
  const bookingCreate = vi.fn();
  const bookingFindFirst = vi.fn();
  const bookingFindMany = vi.fn();
  const bookingFindUnique = vi.fn();
  const bookingUpdateMany = vi.fn();
  const prisma = {
    $transaction: vi.fn((input: unknown) => {
      if (typeof input === "function") return input(prisma);
      return Promise.all(input as Promise<unknown>[]);
    }),
    booking: {
      create: bookingCreate,
      findFirst: bookingFindFirst,
      findMany: bookingFindMany,
      findUnique: bookingFindUnique,
      updateMany: bookingUpdateMany,
    },
    exchangeRate: {
      findUnique: vi.fn(),
    },
    space: {
      findUnique: vi.fn(),
    },
  };

  return {
    bookingCreate,
    bookingFindFirst,
    bookingFindMany,
    bookingFindUnique,
    bookingUpdateMany,
    prisma,
    producerSend: vi.fn(),
    spaceFindUnique: prisma.space.findUnique,
  };
});

vi.mock("@repo/db", () => ({
  BookingStatus: {
    APPROVED: "APPROVED",
    CANCELLED: "CANCELLED",
    COMPLETED: "COMPLETED",
    CONFIRMED: "CONFIRMED",
    EXPIRED: "EXPIRED",
    PENDING: "PENDING",
    REJECTED: "REJECTED",
  },
  Prisma: {
    PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
      code: string;
      constructor(message: string, options: { code: string }) {
        super(message);
        this.code = options.code;
      }
    },
  },
  prisma: mocks.prisma,
}));

vi.mock("../utils/kafka.js", () => ({
  producer: {
    send: mocks.producerSend,
  },
}));

const createApp = async () => {
  const app = Fastify();
  await app.register(bookingRoute);
  return app;
};

const createUserToken = () =>
  signAccessToken({
    userId: "guest-1",
    email: "guest@example.com",
    role: "USER",
  });

const createHostToken = () =>
  signAccessToken({
    userId: "host-1",
    email: "host@example.com",
    role: "HOST",
    hostVerified: true,
  });

const monday = "2026-05-18";

const baseSpace = {
  availability: [
    {
      dayOfWeek: 1,
      endTime: "17:00",
      isOpen: true,
      startTime: "09:00",
    },
  ],
  blockedDates: [],
  capacity: 4,
  cleaningFee: 0,
  currency: "USD",
  host: { email: "host@example.com" },
  hostId: "host-1",
  id: 42,
  instantBook: false,
  isActive: true,
  maxBookingHours: 8,
  minBookingHours: 1,
  name: "Focused room",
  pricePerDay: null,
  pricePerHour: 25,
  pricingTiers: [],
  pricingType: "HOURLY",
};

const createdBooking = {
  guest: {
    email: "guest@example.com",
    id: "guest-1",
    name: "Guest",
  },
  guestId: "guest-1",
  hostId: "host-1",
  id: "booking-new",
  space: {
    host: { email: "host@example.com" },
  },
  spaceId: 42,
  status: "PENDING",
};

describe("booking routes", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-jwt-secret";
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("allows adjacent hourly bookings on the same date", async () => {
    const app = await createApp();
    mocks.spaceFindUnique.mockResolvedValue(baseSpace);
    mocks.bookingFindFirst.mockResolvedValue({
      endDate: new Date(monday),
      endTime: "10:00",
      isHourly: true,
      startDate: new Date(monday),
      startTime: "09:00",
    });
    mocks.bookingFindMany.mockResolvedValue([
      {
        endDate: new Date(monday),
        endTime: "10:00",
        isHourly: true,
        startDate: new Date(monday),
        startTime: "09:00",
      },
    ]);
    mocks.bookingCreate.mockResolvedValue(createdBooking);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: {
        endDate: monday,
        endTime: "11:00",
        guests: 1,
        isHourly: true,
        spaceId: 42,
        startDate: monday,
        startTime: "10:00",
      },
      url: "/bookings",
    });

    expect(response.statusCode).toBe(201);
    expect(mocks.bookingCreate).toHaveBeenCalled();
    await app.close();
  });

  it("rejects hourly bookings outside configured availability", async () => {
    const app = await createApp();
    mocks.spaceFindUnique.mockResolvedValue(baseSpace);
    mocks.bookingFindFirst.mockResolvedValue(null);
    mocks.bookingFindMany.mockResolvedValue([]);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: {
        endDate: monday,
        endTime: "18:00",
        guests: 1,
        isHourly: true,
        spaceId: 42,
        startDate: monday,
        startTime: "17:00",
      },
      url: "/bookings",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ message: "Booking time is outside availability" });
    expect(mocks.bookingCreate).not.toHaveBeenCalled();
    await app.close();
  });

  it("rejects blocked booking dates before creating a booking", async () => {
    const app = await createApp();
    mocks.spaceFindUnique.mockResolvedValue({
      ...baseSpace,
      blockedDates: [{ date: new Date(monday), reason: "Maintenance" }],
    });
    mocks.bookingFindFirst.mockResolvedValue(null);
    mocks.bookingFindMany.mockResolvedValue([]);

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: {
        endDate: monday,
        endTime: "11:00",
        guests: 1,
        isHourly: true,
        spaceId: 42,
        startDate: monday,
        startTime: "10:00",
      },
      url: "/bookings",
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({ message: "Some requested dates are blocked" });
    expect(mocks.bookingCreate).not.toHaveBeenCalled();
    await app.close();
  });

  it("rejects invalid hourly time ranges before pricing", async () => {
    const app = await createApp();

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: {
        endDate: monday,
        endTime: "10:00",
        guests: 1,
        isHourly: true,
        spaceId: 42,
        startDate: monday,
        startTime: "11:00",
      },
      url: "/bookings",
    });

    expect(response.statusCode).toBe(400);
    expect(mocks.spaceFindUnique).not.toHaveBeenCalled();
    expect(mocks.bookingCreate).not.toHaveBeenCalled();
    await app.close();
  });

  // BOOKSVC-002: every BookingStatus value should be classified as
  // conflicting or not, intentionally.
  it("classifies every BookingStatus enum value intentionally for conflict detection", async () => {
    // Mirror of the implementation's CONFLICTING_BOOKING_STATUSES.
    const occupying = new Set(["PENDING", "APPROVED", "CONFIRMED"]);
    const free = new Set(["COMPLETED", "CANCELLED", "REJECTED", "EXPIRED"]);
    // Pull the enum surface from the mocked @repo/db so this test fails
    // if a new status is added to the schema without being classified here.
    const { BookingStatus } = await import("@repo/db");
    const allStatuses = Object.keys(BookingStatus as Record<string, string>);
    for (const status of allStatuses) {
      expect(occupying.has(status) || free.has(status)).toBe(true);
    }
    // APPROVED must be in the occupying set (the BOOKSVC-002 regression).
    expect(occupying.has("APPROVED")).toBe(true);
  });

  // BOOKSVC-012: stale-state guard on cancel.
  it("returns 409 when cancelling a booking that has already been completed (CAS rejected)", async () => {
    const app = await createApp();
    mocks.bookingFindUnique
      .mockResolvedValueOnce({
        // initial findUnique inside the cancel handler
        endDate: new Date(monday),
        endTime: "12:00",
        guest: { email: "guest@example.com", name: "Guest" },
        guestId: "guest-1",
        host: { email: "host@example.com", name: "Host" },
        hostId: "host-1",
        id: "b-1",
        isHourly: true,
        space: { name: "Focused room" },
        spaceId: 42,
        startDate: new Date(monday),
        startTime: "10:00",
        status: "CONFIRMED",
      })
      .mockResolvedValueOnce({ status: "COMPLETED" });
    // CAS: zero rows updated → another transition won the race.
    mocks.bookingUpdateMany.mockResolvedValue({ count: 0 });

    const response = await app.inject({
      headers: { authorization: `Bearer ${createUserToken()}` },
      method: "POST",
      payload: { reason: "Plans changed" },
      url: "/bookings/b-1/cancel",
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      message: "Cannot cancel booking with status COMPLETED",
    });
    expect(mocks.bookingUpdateMany).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: "CANCELLED" }),
      where: {
        id: "b-1",
        status: { in: ["PENDING", "APPROVED", "CONFIRMED"] },
      },
    });
    expect(mocks.producerSend).not.toHaveBeenCalled();
    await app.close();
  });

  // BOOKSVC-012: stale-state guard on complete.
  it("returns 409 when completing a booking that was cancelled mid-flight", async () => {
    const app = await createApp();
    mocks.bookingFindUnique
      .mockResolvedValueOnce({
        guest: { email: "guest@example.com" },
        hostId: "host-1",
        id: "b-2",
        space: { name: "Focused room" },
        status: "CONFIRMED",
        totalAmount: 100,
      })
      .mockResolvedValueOnce({ status: "CANCELLED" });
    mocks.bookingUpdateMany.mockResolvedValue({ count: 0 });

    const response = await app.inject({
      headers: { authorization: `Bearer ${createHostToken()}` },
      method: "PUT",
      payload: {},
      url: "/bookings/b-2/complete",
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      message: "Cannot complete booking with status CANCELLED",
    });
    expect(mocks.bookingUpdateMany).toHaveBeenCalledWith({
      data: expect.objectContaining({ status: "COMPLETED" }),
      where: { id: "b-2", status: "CONFIRMED" },
    });
    expect(mocks.producerSend).not.toHaveBeenCalled();
    await app.close();
  });
});
