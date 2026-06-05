import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createReview,
  respondToReview,
  updateReview,
} from "./review.controller.js";

const mocks = vi.hoisted(() => ({
  spaceFindUnique: vi.fn(),
  bookingFindFirst: vi.fn(),
  reviewFindUnique: vi.fn(),
  reviewCreate: vi.fn(),
  reviewUpdate: vi.fn(),
}));

vi.mock("@repo/db", () => ({
  prisma: {
    space: {
      findUnique: mocks.spaceFindUnique,
    },
    booking: {
      findFirst: mocks.bookingFindFirst,
    },
    review: {
      findUnique: mocks.reviewFindUnique,
      create: mocks.reviewCreate,
      update: mocks.reviewUpdate,
    },
  },
}));

const createResponse = () => {
  const res = {
    json: vi.fn(),
    status: vi.fn(),
  } as unknown as Response & {
    json: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };

  res.status.mockReturnValue(res);
  return res;
};

const buildCreateReq = (
  body: unknown,
  params: Record<string, string> = { id: "1" },
  userId = "user-1",
): Request =>
  ({
    body,
    params,
    userId,
    user: { role: "USER" },
  }) as unknown as Request;

const buildRespondReq = (
  body: unknown,
  params: Record<string, string> = { reviewId: "1" },
  userId = "host-1",
  role: string = "HOST",
): Request =>
  ({
    body,
    params,
    userId,
    user: { role },
  }) as unknown as Request;

describe("review controller validation", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("rejects invalid update ratings before writing to Prisma", async () => {
    mocks.reviewFindUnique.mockResolvedValue({
      id: 10,
      rating: 4,
      userId: "user-1",
    });
    const req = {
      body: { rating: 6 },
      params: { reviewId: "10" },
      user: { role: "USER" },
      userId: "user-1",
    } as unknown as Request;
    const res = createResponse();

    await updateReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Rating must be between 1 and 5" });
    expect(mocks.reviewUpdate).not.toHaveBeenCalled();
  });
});

describe("createReview input validation (PRODSVC-005)", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  const validBody = {
    bookingId: "booking-cuid",
    rating: 4,
    comment: "Lovely place.",
  };

  it("rejects missing bookingId with 400 and never touches Prisma", async () => {
    const req = buildCreateReq({ rating: 4, comment: "ok" });
    const res = createResponse();

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "bookingId is required" });
    expect(mocks.bookingFindFirst).not.toHaveBeenCalled();
    expect(mocks.reviewFindUnique).not.toHaveBeenCalled();
    expect(mocks.reviewCreate).not.toHaveBeenCalled();
  });

  it("rejects whitespace-only bookingId", async () => {
    const req = buildCreateReq({ ...validBody, bookingId: "   " });
    const res = createResponse();

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "bookingId is required" });
  });

  it("rejects non-string bookingId", async () => {
    const req = buildCreateReq({ ...validBody, bookingId: 42 });
    const res = createResponse();

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "bookingId is required" });
  });

  it("rejects out-of-range rating", async () => {
    const req = buildCreateReq({ ...validBody, rating: 7 });
    const res = createResponse();

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Rating must be between 1 and 5" });
  });

  it("rejects missing comment", async () => {
    const req = buildCreateReq({ bookingId: "bk", rating: 5 });
    const res = createResponse();

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "comment is required" });
  });

  it("rejects empty/whitespace comment", async () => {
    const req = buildCreateReq({ ...validBody, comment: "   " });
    const res = createResponse();

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "comment must not be empty",
    });
  });

  it("rejects comment over 5000 characters", async () => {
    const req = buildCreateReq({ ...validBody, comment: "a".repeat(5001) });
    const res = createResponse();

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("5000") as unknown as string,
    });
  });

  it("rejects undefined body without crashing", async () => {
    const req = buildCreateReq(undefined);
    const res = createResponse();

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "bookingId is required" });
  });

  it("happy path: trims inputs and forwards normalised values to Prisma", async () => {
    mocks.spaceFindUnique.mockResolvedValueOnce({ id: 1 });
    mocks.bookingFindFirst.mockResolvedValueOnce({
      id: "booking-cuid",
      spaceId: 1,
      guestId: "user-1",
      status: "COMPLETED",
    });
    mocks.reviewFindUnique.mockResolvedValueOnce(null);
    mocks.reviewCreate.mockResolvedValueOnce({
      id: 99,
      bookingId: "booking-cuid",
      rating: 4,
      comment: "Lovely place.",
    });

    const req = buildCreateReq({
      bookingId: "  booking-cuid  ",
      rating: 4,
      comment: "  Lovely place.  ",
    });
    const res = createResponse();

    await createReview(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(mocks.bookingFindFirst).toHaveBeenCalledWith({
      where: {
        id: "booking-cuid",
        spaceId: 1,
        guestId: "user-1",
        status: "COMPLETED",
      },
    });
    expect(mocks.reviewFindUnique).toHaveBeenCalledWith({
      where: { bookingId: "booking-cuid" },
    });
    expect(mocks.reviewCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bookingId: "booking-cuid",
          comment: "Lovely place.",
          rating: 4,
        }),
      }),
    );
  });
});

describe("respondToReview input validation (PRODSVC-011)", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("rejects missing response with 400 and never touches Prisma", async () => {
    const req = buildRespondReq({});
    const res = createResponse();

    await respondToReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "response is required" });
    expect(mocks.reviewFindUnique).not.toHaveBeenCalled();
    expect(mocks.reviewUpdate).not.toHaveBeenCalled();
  });

  it("rejects non-string response (number)", async () => {
    const req = buildRespondReq({ response: 123 });
    const res = createResponse();

    await respondToReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "response is required" });
  });

  it("rejects null response (would otherwise wipe the host response)", async () => {
    const req = buildRespondReq({ response: null });
    const res = createResponse();

    await respondToReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "response is required" });
  });

  it("rejects whitespace-only response", async () => {
    const req = buildRespondReq({ response: "   " });
    const res = createResponse();

    await respondToReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "response must not be empty",
    });
  });

  it("rejects response over 2000 characters", async () => {
    const req = buildRespondReq({ response: "x".repeat(2001) });
    const res = createResponse();

    await respondToReview(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: expect.stringContaining("2000") as unknown as string,
    });
  });

  it("happy path: trims response and writes it through to Prisma", async () => {
    mocks.reviewFindUnique.mockResolvedValueOnce({
      id: 1,
      space: { hostId: "host-1" },
    });
    mocks.reviewUpdate.mockResolvedValueOnce({
      id: 1,
      hostResponse: "Thanks for your feedback.",
    });

    const req = buildRespondReq({
      response: "  Thanks for your feedback.  ",
    });
    const res = createResponse();

    await respondToReview(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mocks.reviewUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({
          hostResponse: "Thanks for your feedback.",
        }),
      }),
    );
  });
});
