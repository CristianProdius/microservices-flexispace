"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

export interface VenueListItem {
  id: number;
  name: string;
  shortDescription: string;
  city: string;
  country: string;
  images: string[];
  spaceCount: number;
  host: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
    hostingSince: string | null;
    hostVerified: boolean;
  };
}

const VenueCard = ({ venue }: { venue: VenueListItem }) => {
  const t = useTranslations("hosts.card");
  const tVenue = useTranslations("venue");

  const hostDisplayName = venue.host.name ?? venue.host.username;
  const venueInitial = venue.name.slice(0, 1).toUpperCase();
  const location =
    venue.city && venue.country
      ? `${venue.city}, ${venue.country}`
      : venue.city || venue.country || "";
  const heroImage = venue.images[0] ?? null;
  const venueHref = `/venues/${venue.id}` as const;

  return (
    <div className="group">
      {/* IMAGE — links straight to the venue detail page. */}
      <Link href={venueHref} className="block">
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-subtle">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={venue.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl font-semibold text-foreground">
              {venueInitial}
            </div>
          )}
          {venue.host.hostVerified && (
            <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-success/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
              <Check className="size-3" />
              {tVenue("verified")}
            </span>
          )}
        </div>
      </Link>

      {/* DETAILS */}
      <div className="pt-3 flex flex-col gap-0.5">
        <Link href={venueHref} className="min-w-0">
          <h3 className="font-semibold text-foreground line-clamp-1 hover:underline">
            {venue.name}
          </h3>
        </Link>

        {location && (
          <p className="text-sm text-muted line-clamp-1">{location}</p>
        )}

        <p className="text-sm text-muted line-clamp-1">
          {t("hostedBy", { name: hostDisplayName })}
        </p>

        {venue.spaceCount > 0 && (
          <p className="text-sm font-semibold text-foreground mt-1">
            {t("spaces", { count: venue.spaceCount })}
          </p>
        )}
      </div>
    </div>
  );
};

export default VenueCard;
