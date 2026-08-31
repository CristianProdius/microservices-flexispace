"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { Check, Megaphone, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { hostProfileHref, type HostSummary } from "@repo/types";

const HostCard = ({ host }: { host: HostSummary }) => {
  const t = useTranslations("hosts.card");
  const tVenue = useTranslations("venue");
  const displayName = host.name ?? host.username;
  const initials = displayName.slice(0, 1).toUpperCase();
  const hostingYear = host.hostingSince ? new Date(host.hostingSince).getFullYear() : null;
  const location = host.cities.slice(0, 2).join(", ");
  const heroImage = host.image ?? host.coverImage;
  const badges = [
    {
      visible: host.hostSponsored,
      label: tVenue("sponsored"),
      icon: Megaphone,
      className: "bg-emerald-600/95 text-white",
    },
    {
      visible: host.hostRecommended,
      label: tVenue("recommended"),
      icon: Star,
      className: "bg-amber-500/95 text-white",
    },
    {
      visible: host.hostVerificationStatus === "VERIFIED",
      label: tVenue("verified"),
      icon: Check,
      className: "bg-success/90 text-white",
    },
  ];

  return (
    <div className="group">
      {/* IMAGE — links to the host profile */}
      <Link href={hostProfileHref(host)} className="block">
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-subtle">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={displayName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-5xl font-semibold text-foreground">
              {initials}
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
        <Link href={hostProfileHref(host)} className="min-w-0">
          <h3 className="font-semibold text-foreground line-clamp-1 hover:underline">
            {displayName}
          </h3>
        </Link>

        {location && (
          <p className="text-sm text-muted line-clamp-1">{location}</p>
        )}

        <p className="text-sm font-semibold text-foreground mt-1">
          {t("venues", { count: host.venueCount })} · {t("spaces", { count: host.spaceCount })}
        </p>
      </div>
    </div>
  );
};

export default HostCard;
