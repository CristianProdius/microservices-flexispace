"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Check, Megaphone, Star } from "lucide-react";
import { useTranslations } from "next-intl";

export interface VenueListItem {
  id: number;
  name: string;
  shortDescription: string;
  city: string;
  country: string;
  images: string[];
  venueVerified: boolean;
  venueRecommended: boolean;
  venueSponsored: boolean;
  spaceCount: number;
  host: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
    hostingSince: string | null;
    hostVerified: boolean;
    hostRecommended: boolean;
    hostSponsored: boolean;
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
  const hostingYear = venue.host.hostingSince
    ? new Date(venue.host.hostingSince).getFullYear()
    : null;
  const badges = [
    {
      visible: venue.venueSponsored || venue.host.hostSponsored,
      label: tVenue("sponsored"),
      icon: Megaphone,
      className: "bg-emerald-600/95 text-white",
    },
    {
      visible: venue.venueRecommended || venue.host.hostRecommended,
      label: tVenue("recommended"),
      icon: Star,
      className: "bg-amber-500/95 text-white",
    },
    {
      visible: venue.venueVerified || venue.host.hostVerified,
      label: venue.venueVerified ? tVenue("verifiedVenue") : tVenue("verified"),
      icon: Check,
      className: "bg-success/90 text-white",
    },
  ];

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
          {hostingYear && (
            <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-foreground text-xs px-2 py-1 rounded-full border border-border/50">
              {t("hostingSince", { year: hostingYear })}
            </span>
          )}
          <div className="absolute right-3 top-3 flex max-w-[75%] flex-col items-end gap-1">
            {badges.map(({ visible, label, icon: Icon, className }) =>
              visible ? (
                <span
                  key={label}
                  className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-1 text-xs font-medium shadow-sm backdrop-blur-sm ${className}`}
                >
                  <Icon className="size-3" />
                  <span className="truncate">{label}</span>
                </span>
              ) : null
            )}
          </div>
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
