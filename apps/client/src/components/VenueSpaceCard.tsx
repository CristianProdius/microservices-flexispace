"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Check, MapPin, Megaphone, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { parseImages } from "@/lib/utils";
import type { VerificationStatus } from "@repo/types";

interface VenueCardData {
  id: number;
  name: string;
  shortDescription?: string;
  city: string;
  country: string;
  images: string[] | string;
  venueVerificationStatus?: VerificationStatus;
  venueRecommended?: boolean;
  venueSponsored?: boolean;
  spaceCount: number;
}

const VenueSpaceCard = ({ venue }: { venue: VenueCardData }) => {
  const images = parseImages(venue.images);
  const t = useTranslations("hosts.card");
  const tProfile = useTranslations("hosts.profile");
  const tVenue = useTranslations("venue");
  const badges = [
    {
      visible: venue.venueSponsored,
      label: tVenue("sponsored"),
      icon: Megaphone,
      className: "bg-emerald-600/95 text-white",
    },
    {
      visible: venue.venueRecommended,
      label: tVenue("recommended"),
      icon: Star,
      className: "bg-amber-500/95 text-white",
    },
    {
      visible: venue.venueVerificationStatus === "VERIFIED",
      label: tVenue("verifiedVenue"),
      icon: Check,
      className: "bg-success/90 text-white",
    },
  ];
  return (
    <Link href={`/venues/${venue.id}`} className="group block">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
        <Image
          src={images[0] || "/placeholder-space.jpg"}
          alt={venue.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
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
      <div className="pt-3 flex flex-col gap-0.5">
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:underline">
          {venue.name}
        </h3>
        <p className="text-sm text-muted line-clamp-1 inline-flex items-center gap-1">
          <MapPin className="size-3.5" />
          {venue.city}, {venue.country}
        </p>
        <p className="text-sm text-foreground mt-1">
          {t("spaces", { count: venue.spaceCount })}
        </p>
        <span className="text-xs text-muted mt-1 group-hover:underline">
          {tProfile("viewVenue")} →
        </span>
      </div>
    </Link>
  );
};

export default VenueSpaceCard;
