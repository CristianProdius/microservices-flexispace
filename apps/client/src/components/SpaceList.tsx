import { Space } from "@repo/types";
import SpaceCategories from "./SpaceCategories";
import SpaceCard from "./SpaceCard";
import SpaceFilter from "./SpaceFilter";
import Link from "next/link";

interface FetchParams {
  type?: string;
  city?: string;
  capacity?: string;
  minPrice?: string;
  maxPrice?: string;
  instantBook?: string;
  sort?: string;
  limit?: string;
}

const fetchSpaces = async (params: FetchParams): Promise<Space[]> => {
  const searchParams = new URLSearchParams();

  if (params.type && params.type !== "all") {
    searchParams.set("spaceType", params.type);
  }
  if (params.city) searchParams.set("city", params.city);
  if (params.capacity) searchParams.set("capacity", params.capacity);
  if (params.minPrice) searchParams.set("minPrice", params.minPrice);
  if (params.maxPrice) searchParams.set("maxPrice", params.maxPrice);
  if (params.instantBook) searchParams.set("instantBook", params.instantBook);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.limit) searchParams.set("limit", params.limit);

  const url = `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces?${searchParams.toString()}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.error("Failed to fetch spaces:", res.status);
      return [];
    }
    const data = await res.json();
    return data.spaces || data || [];
  } catch (error) {
    console.error("Error fetching spaces:", error);
    return [];
  }
};

interface SpaceListProps {
  type?: string;
  city?: string;
  capacity?: string;
  minPrice?: string;
  maxPrice?: string;
  instantBook?: string;
  sort?: string;
  variant: "homepage" | "browse";
}

const SpaceList = async ({
  type,
  city,
  capacity,
  minPrice,
  maxPrice,
  instantBook,
  sort,
  variant,
}: SpaceListProps) => {
  const spaces = await fetchSpaces({
    type,
    city,
    capacity,
    minPrice,
    maxPrice,
    instantBook,
    sort: sort || "newest",
    limit: variant === "homepage" ? "8" : undefined,
  });

  return (
    <div className="w-full">
      <SpaceCategories />
      {variant === "browse" && <SpaceFilter />}

      {spaces.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No spaces found matching your criteria.</p>
          <p className="text-gray-400 mt-2">Try adjusting your filters or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {spaces.map((space) => (
            <SpaceCard key={space.id} space={space} />
          ))}
        </div>
      )}

      {variant === "homepage" && spaces.length > 0 && (
        <div className="flex justify-center mt-8">
          <Link
            href="/spaces"
            className="px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
          >
            View All Spaces
          </Link>
        </div>
      )}
    </div>
  );
};

export default SpaceList;
