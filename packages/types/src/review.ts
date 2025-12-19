import z from "zod";
import type { User } from "./auth";

export interface Review {
  id: number;
  rating: number; // 1-5
  comment: string | null;

  userId: string;
  spaceId: number;
  bookingId: string;

  hostResponse: string | null;
  hostRespondedAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface ReviewWithUser extends Review {
  user: Pick<User, "id" | "name" | "image">;
}

export interface SpaceRatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// Zod Schemas
export const CreateReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const HostResponseSchema = z.object({
  response: z.string().min(1, "Response is required"),
});

export type CreateReviewInput = z.infer<typeof CreateReviewSchema>;
export type HostResponseInput = z.infer<typeof HostResponseSchema>;
