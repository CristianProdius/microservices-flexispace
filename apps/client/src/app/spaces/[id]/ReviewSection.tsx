"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import Image from "next/image";

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  hostResponse: string | null;
  hostRespondedAt: string | null;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

interface ReviewsResponse {
  reviews: Review[];
  stats: ReviewStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ReviewSectionProps {
  spaceId: number;
}

const ReviewSection = ({ spaceId }: ReviewSectionProps) => {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces/${spaceId}/reviews?page=${page}&limit=5`
        );
        if (res.ok) {
          const reviewData = await res.json();
          setData(reviewData);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [spaceId, page]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg">
              <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
              <div className="h-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.stats.totalReviews === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Reviews</h2>
        <p className="text-gray-500">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  const { reviews, stats, pagination } = data;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        Reviews ({stats.totalReviews})
      </h2>

      {/* Rating Summary */}
      <div className="flex items-start gap-8 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900">
            {stats.averageRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= Math.round(stats.averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {stats.totalReviews} reviews
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats.ratingDistribution[rating] || 0;
            const percentage =
              stats.totalReviews > 0
                ? (count / stats.totalReviews) * 100
                : 0;

            return (
              <div key={rating} className="flex items-center gap-2 text-sm">
                <span className="w-3">{rating}</span>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-gray-500">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviews.map((review) => (
          <div key={review.id} className="border-b border-gray-100 pb-6">
            <div className="flex items-start gap-4">
              <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0">
                <Image
                  src={review.user.image || "/default-avatar.png"}
                  alt={review.user.name || "User"}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">
                    {review.user.name || "Anonymous"}
                  </span>
                  <span className="text-gray-400 text-sm">·</span>
                  <span className="text-gray-500 text-sm">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= review.rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                {review.comment && (
                  <p className="text-gray-600">{review.comment}</p>
                )}

                {/* Host Response */}
                {review.hostResponse && (
                  <div className="mt-4 ml-4 p-3 bg-gray-50 rounded-lg border-l-2 border-gray-300">
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      Response from host
                    </p>
                    <p className="text-sm text-gray-600">{review.hostResponse}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-4 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
