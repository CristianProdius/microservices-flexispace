import { SpaceWithHost } from "@repo/types";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  MapPin,
  Users,
  Star,
  Clock,
  Calendar,
  Shield,
  Check,
} from "lucide-react";
import BookingForm from "./BookingForm";
import ReviewSection from "./ReviewSection";

const spaceTypeLabels: Record<string, string> = {
  OFFICE_DESK: "Office Desk",
  PRIVATE_OFFICE: "Private Office",
  MEETING_ROOM: "Meeting Room",
  EVENT_VENUE: "Event Venue",
  WEDDING_VENUE: "Wedding Venue",
  COWORKING_SPACE: "Coworking Space",
};

// Parse images field - handles both array and stringified array
const parseImages = (images: unknown): string[] => {
  if (Array.isArray(images)) return images;
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const cancellationLabels: Record<string, { label: string; description: string }> = {
  FLEXIBLE: {
    label: "Flexible",
    description: "Full refund up to 24 hours before check-in",
  },
  MODERATE: {
    label: "Moderate",
    description: "Full refund up to 5 days before check-in",
  },
  STRICT: {
    label: "Strict",
    description: "50% refund up to 7 days before check-in",
  },
  NON_REFUNDABLE: {
    label: "Non-refundable",
    description: "No refund after booking",
  },
};

async function getSpace(id: string): Promise<SpaceWithHost | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_PRODUCT_SERVICE_URL}/spaces/${id}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

interface SpaceDetailPageProps {
  params: Promise<{ id: string }>;
}

const SpaceDetailPage = async ({ params }: SpaceDetailPageProps) => {
  const { id } = await params;
  const space = await getSpace(id);

  if (!space) {
    notFound();
  }

  const images = parseImages(space.images);
  const cancellation = cancellationLabels[space.cancellationPolicy] || {
    label: space.cancellationPolicy,
    description: "Contact host for details",
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-8 rounded-xl overflow-hidden">
        <div className="relative aspect-[4/3] md:aspect-auto md:row-span-2">
          <Image
            src={images[0] || "/placeholder-space.jpg"}
            alt={space.name}
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {images.slice(1, 5).map((img, idx) => (
            <div key={idx} className="relative aspect-[4/3]">
              <Image
                src={img}
                alt={`${space.name} - ${idx + 2}`}
                fill
                className="object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <span className="bg-gray-100 px-2 py-1 rounded">
                {spaceTypeLabels[space.spaceType]}
              </span>
              {space.instantBook && (
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                  Instant Book
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {space.name}
            </h1>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span>
                  {space.address}, {space.city}, {space.country}
                </span>
              </div>
              {space.averageRating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{space.averageRating.toFixed(1)}</span>
                  <span className="text-gray-400">
                    ({space.totalReviews} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Host Info */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className="relative w-14 h-14 rounded-full overflow-hidden">
              <Image
                src={space.host?.image || "/default-avatar.png"}
                alt={space.host?.name || "Host"}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                Hosted by {space.host?.name || "Unknown"}
              </p>
              {space.host?.hostingSince && (
                <p className="text-sm text-gray-500">
                  Hosting since{" "}
                  {new Date(space.host.hostingSince).getFullYear()}
                </p>
              )}
            </div>
          </div>

          {/* Key Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Users className="w-6 h-6 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">{space.capacity}</p>
                <p className="text-sm text-gray-500">Capacity</p>
              </div>
            </div>
            {space.pricingType === "HOURLY" || space.pricingType === "BOTH" ? (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Clock className="w-6 h-6 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    ${space.pricePerHour}/hr
                  </p>
                  <p className="text-sm text-gray-500">Hourly Rate</p>
                </div>
              </div>
            ) : null}
            {space.pricingType === "DAILY" || space.pricingType === "BOTH" ? (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-6 h-6 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    ${space.pricePerDay}/day
                  </p>
                  <p className="text-sm text-gray-500">Daily Rate</p>
                </div>
              </div>
            ) : null}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Shield className="w-6 h-6 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">
                  {space.depositPercent}%
                </p>
                <p className="text-sm text-gray-500">Deposit</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              About this space
            </h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {space.description}
            </p>
          </div>

          {/* Amenities */}
          {space.amenities && space.amenities.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Amenities
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {space.amenities.map((sa) => (
                  <div
                    key={sa.id}
                    className="flex items-center gap-2 text-gray-600"
                  >
                    <Check className="w-5 h-5 text-green-500" />
                    <span>{sa.amenity.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* House Rules */}
          {space.houseRules && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                House Rules
              </h2>
              <p className="text-gray-600 whitespace-pre-line">
                {space.houseRules}
              </p>
            </div>
          )}

          {/* Cancellation Policy */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Cancellation Policy
            </h2>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{cancellation.label}</p>
              <p className="text-gray-600 text-sm mt-1">
                {cancellation.description}
              </p>
            </div>
          </div>

          {/* Reviews */}
          <ReviewSection spaceId={space.id} />
        </div>

        {/* Booking Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <BookingForm space={space} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceDetailPage;
