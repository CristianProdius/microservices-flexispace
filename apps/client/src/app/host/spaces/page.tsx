"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import useAuthStore from "@/stores/authStore";
import {
  Plus,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Power,
  PowerOff,
  MapPin,
  Users,
  Star,
} from "lucide-react";

interface Space {
  id: number;
  name: string;
  images: string[];
  city: string;
  country: string;
  capacity: number;
  pricePerHour: number | null;
  pricePerDay: number | null;
  pricingType: string;
  isActive: boolean;
  averageRating: number | null;
  totalReviews: number;
  _count?: {
    bookings: number;
  };
}

const HostSpacesPage = () => {
  const { token } = useAuthStore();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  useEffect(() => {
    fetchSpaces();
  }, [token]);

  const fetchSpaces = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces/host/my`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setSpaces(data);
      }
    } catch (error) {
      console.error("Error fetching spaces:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSpaceStatus = async (spaceId: number, currentStatus: boolean) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces/${spaceId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isActive: !currentStatus }),
        }
      );

      if (res.ok) {
        setSpaces((prev) =>
          prev.map((s) =>
            s.id === spaceId ? { ...s, isActive: !currentStatus } : s
          )
        );
      }
    } catch (error) {
      console.error("Error toggling space status:", error);
    }
    setMenuOpen(null);
  };

  const deleteSpace = async (spaceId: number) => {
    if (!confirm("Are you sure you want to delete this space?")) return;

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces/${spaceId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        setSpaces((prev) => prev.filter((s) => s.id !== spaceId));
      }
    } catch (error) {
      console.error("Error deleting space:", error);
    }
    setMenuOpen(null);
  };

  const getPriceDisplay = (space: Space) => {
    if (space.pricingType === "HOURLY" && space.pricePerHour) {
      return `$${space.pricePerHour}/hr`;
    }
    if (space.pricingType === "DAILY" && space.pricePerDay) {
      return `$${space.pricePerDay}/day`;
    }
    if (space.pricingType === "BOTH") {
      return space.pricePerHour
        ? `$${space.pricePerHour}/hr`
        : `$${space.pricePerDay}/day`;
    }
    return "—";
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Spaces</h1>
          <p className="text-gray-600 mt-1">
            Manage your listed spaces
          </p>
        </div>
        <Link
          href="/host/spaces/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Space
        </Link>
      </div>

      {spaces.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <p className="text-gray-500 text-lg mb-4">
            You haven&apos;t listed any spaces yet
          </p>
          <Link
            href="/host/spaces/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Space
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {spaces.map((space) => (
            <div
              key={space.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                {/* Image */}
                <div className="relative w-32 h-24 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={space.images?.[0] || "/placeholder-space.jpg"}
                    alt={space.name}
                    fill
                    className="object-cover"
                  />
                  {!space.isActive && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xs font-medium">
                        Inactive
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {space.name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {space.city}, {space.country}
                        </span>
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setMenuOpen(menuOpen === space.id ? null : space.id)
                        }
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreVertical className="w-5 h-5 text-gray-500" />
                      </button>

                      {menuOpen === space.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <Link
                            href={`/spaces/${space.id}`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="w-4 h-4" />
                            View Listing
                          </Link>
                          <Link
                            href={`/host/spaces/${space.id}/edit`}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit className="w-4 h-4" />
                            Edit Space
                          </Link>
                          <button
                            onClick={() =>
                              toggleSpaceStatus(space.id, space.isActive)
                            }
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            {space.isActive ? (
                              <>
                                <PowerOff className="w-4 h-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Power className="w-4 h-4" />
                                Activate
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => deleteSpace(space.id)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{space.capacity}</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {getPriceDisplay(space)}
                    </span>
                    {space.averageRating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-gray-900">
                          {space.averageRating.toFixed(1)}
                        </span>
                        <span className="text-gray-500">
                          ({space.totalReviews})
                        </span>
                      </div>
                    )}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        space.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {space.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HostSpacesPage;
