"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { formatPrice, parseImages } from "@/lib/utils";

interface SpaceMapPinProps {
  space: {
    id: number;
    name: string;
    images: unknown;
    pricePerHour: number | null;
    pricePerDay: number | null;
    pricingType: string;
    currency?: string;
    venue?: { name: string } | null;
  };
}

const SpaceMapPin = ({ space }: SpaceMapPinProps) => {
  const images = parseImages(space.images);
  const price = space.pricingType === "DAILY" ? space.pricePerDay : space.pricePerHour;
  const priceLabel = space.pricingType === "DAILY" ? "/day" : "/hr";
  const currency = (space as any).currency;

  return (
    <div className="w-[200px]">
      {images[0] && (
        <div className="relative h-[80px] w-full rounded-t overflow-hidden">
          <Image src={images[0]} alt={space.name} fill className="object-cover" sizes="200px" />
        </div>
      )}
      <div className="p-2">
        <p className="font-medium text-sm text-foreground truncate">{space.name}</p>
        {space.venue && space.venue.name !== space.name && (
          <p className="text-xs text-muted truncate">{space.venue.name}</p>
        )}
        {price && (
          <p className="text-sm font-semibold text-primary mt-1">
            {formatPrice(price, currency)}{priceLabel}
          </p>
        )}
        <Link
          href={`/spaces/${space.id}`}
          className="block text-center text-xs font-medium text-primary hover:underline mt-2"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
};

export default SpaceMapPin;
