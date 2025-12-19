"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

const SpaceFilter = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [showFilters, setShowFilters] = useState(false);

  const updateParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleCitySearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const city = formData.get("city") as string;
    updateParams("city", city || null);
  };

  const clearFilters = () => {
    router.push(pathname, { scroll: false });
  };

  const hasActiveFilters = searchParams.toString().length > 0;

  return (
    <div className="mb-6">
      {/* Search Bar and Filters Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <form onSubmit={handleCitySearch} className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              name="city"
              placeholder="Search by city..."
              defaultValue={searchParams.get("city") || ""}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </form>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 border rounded-lg transition-colors ${
            showFilters ? "bg-gray-900 text-white border-gray-900" : "border-gray-200 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          Filters
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
            Clear
          </button>
        )}
      </div>

      {/* Extended Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          {/* Capacity */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Min Capacity</label>
            <select
              value={searchParams.get("capacity") || ""}
              onChange={(e) => updateParams("capacity", e.target.value || null)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any</option>
              <option value="1">1+ person</option>
              <option value="5">5+ people</option>
              <option value="10">10+ people</option>
              <option value="20">20+ people</option>
              <option value="50">50+ people</option>
              <option value="100">100+ people</option>
            </select>
          </div>

          {/* Min Price */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Min Price</label>
            <input
              type="number"
              placeholder="$0"
              value={searchParams.get("minPrice") || ""}
              onChange={(e) => updateParams("minPrice", e.target.value || null)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Max Price */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Max Price</label>
            <input
              type="number"
              placeholder="Any"
              value={searchParams.get("maxPrice") || ""}
              onChange={(e) => updateParams("maxPrice", e.target.value || null)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Instant Book */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Booking Type</label>
            <select
              value={searchParams.get("instantBook") || ""}
              onChange={(e) => updateParams("instantBook", e.target.value || null)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any</option>
              <option value="true">Instant Book Only</option>
              <option value="false">Request to Book</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Sort By</label>
            <select
              value={searchParams.get("sort") || "newest"}
              onChange={(e) => updateParams("sort", e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpaceFilter;
