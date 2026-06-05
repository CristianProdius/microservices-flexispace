import { prisma } from "@repo/db";
import { Request, Response } from "express";
import { parsePositiveInteger, parsePositiveIntegerWithDefault, parseRating } from "../lib/validation.js";

const COMMENT_MAX_LENGTH = 5000;
const HOST_RESPONSE_MAX_LENGTH = 2000;

export const createReview = async (req: Request, res: Response) => {
  const id = req.params.id as string; // space ID
  const spaceId = parsePositiveInteger(id);
  if (spaceId === null) return res.status(400).json({ message: "Invalid ID" });
  const userId = req.userId!;
  const { bookingId, rating, comment } = req.body ?? {};

  // PRODSVC-005: bookingId must be a non-empty string. Without this check,
  // Prisma silently drops `id: undefined` from the WHERE clause and the guest
  // ends up reviewing whichever completed booking the query returns first.
  if (typeof bookingId !== "string" || bookingId.trim() === "") {
    return res.status(400).json({ message: "bookingId is required" });
  }
  const trimmedBookingId = bookingId.trim();

  if (parseRating(rating) === null) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  if (typeof comment !== "string") {
    return res.status(400).json({ message: "comment is required" });
  }
  const trimmedComment = comment.trim();
  if (trimmedComment.length === 0) {
    return res.status(400).json({ message: "comment must not be empty" });
  }
  if (trimmedComment.length > COMMENT_MAX_LENGTH) {
    return res
      .status(400)
      .json({ message: `comment must be at most ${COMMENT_MAX_LENGTH} characters` });
  }

  // Check if space exists
  const space = await prisma.space.findUnique({
    where: { id: spaceId },
  });

  if (!space) {
    return res.status(404).json({ message: "Space not found" });
  }

  // Check if user has a completed booking for this space
  const booking = await prisma.booking.findFirst({
    where: {
      id: trimmedBookingId,
      spaceId,
      guestId: userId,
      status: "COMPLETED",
    },
  });

  if (!booking) {
    return res.status(403).json({
      message: "You can only review spaces you have completed a booking with",
    });
  }

  // Check if user already reviewed this booking
  const existingReview = await prisma.review.findUnique({
    where: { bookingId: trimmedBookingId },
  });

  if (existingReview) {
    return res.status(400).json({
      message: "You have already reviewed this booking",
    });
  }

  const review = await prisma.review.create({
    data: {
      spaceId,
      userId,
      bookingId: trimmedBookingId,
      rating,
      comment: trimmedComment,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  res.status(201).json(review);
};

export const getSpaceReviews = async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const spaceId = parsePositiveInteger(id);
  if (spaceId === null) return res.status(400).json({ message: "Invalid ID" });
  const { page = "1", limit = "10" } = req.query;

  const pageNum = parsePositiveIntegerWithDefault(page, 1);
  const limitNum = parsePositiveIntegerWithDefault(limit, 10, 100);
  if (pageNum === null || limitNum === null) {
    return res.status(400).json({ message: "Invalid pagination" });
  }
  const skip = (pageNum - 1) * limitNum;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { spaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limitNum,
    }),
    prisma.review.count({ where: { spaceId } }),
  ]);

  // Get rating stats
  const ratingStats = await prisma.review.groupBy({
    by: ["rating"],
    where: { spaceId },
    _count: { rating: true },
  });

  const avgRating = await prisma.review.aggregate({
    where: { spaceId },
    _avg: { rating: true },
  });

  res.status(200).json({
    reviews,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
    stats: {
      averageRating: avgRating._avg.rating || 0,
      totalReviews: total,
      ratingDistribution: ratingStats.reduce(
        (acc, item) => {
          acc[item.rating] = item._count.rating;
          return acc;
        },
        {} as Record<number, number>
      ),
    },
  });
};

export const updateReview = async (req: Request, res: Response) => {
  const reviewId = req.params.reviewId as string;
  const reviewIdNum = parsePositiveInteger(reviewId);
  if (reviewIdNum === null) return res.status(400).json({ message: "Invalid ID" });
  const userId = req.userId!;
  const { rating, comment } = req.body;

  if (rating !== undefined && parseRating(rating) === null) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewIdNum },
  });

  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  if (review.userId !== userId && req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Not authorized to update this review" });
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewIdNum },
    data: {
      ...(rating !== undefined && { rating }),
      ...(comment !== undefined && { comment }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  res.status(200).json(updatedReview);
};

export const deleteReview = async (req: Request, res: Response) => {
  const reviewId = req.params.reviewId as string;
  const reviewIdNum = parsePositiveInteger(reviewId);
  if (reviewIdNum === null) return res.status(400).json({ message: "Invalid ID" });
  const userId = req.userId!;

  const review = await prisma.review.findUnique({
    where: { id: reviewIdNum },
  });

  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  if (review.userId !== userId && req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Not authorized to delete this review" });
  }

  await prisma.review.delete({
    where: { id: reviewIdNum },
  });

  res.status(200).json({ message: "Review deleted successfully" });
};

// Add host response to review
export const respondToReview = async (req: Request, res: Response) => {
  const reviewId = req.params.reviewId as string;
  const reviewIdNum = parsePositiveInteger(reviewId);
  if (reviewIdNum === null) return res.status(400).json({ message: "Invalid ID" });
  const hostId = req.userId!;
  const { response } = req.body ?? {};

  // PRODSVC-011: validate `response` before writing. Without this the host
  // could pass undefined (silent no-op), null (wipes the response) or an
  // arbitrarily large payload.
  if (typeof response !== "string") {
    return res.status(400).json({ message: "response is required" });
  }
  const trimmedResponse = response.trim();
  if (trimmedResponse.length === 0) {
    return res.status(400).json({ message: "response must not be empty" });
  }
  if (trimmedResponse.length > HOST_RESPONSE_MAX_LENGTH) {
    return res
      .status(400)
      .json({ message: `response must be at most ${HOST_RESPONSE_MAX_LENGTH} characters` });
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewIdNum },
    include: {
      space: true,
    },
  });

  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  if (review.space.hostId !== hostId && req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Not authorized to respond to this review" });
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewIdNum },
    data: {
      hostResponse: trimmedResponse,
      hostRespondedAt: new Date(),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  res.status(200).json(updatedReview);
};
