import { notFound } from "next/navigation";
import Image from "next/image";
import { Check, RefreshCw, AlertCircle, Megaphone, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PRODUCT_SERVICE_URL } from "@/lib/config";
import VenueSpaceCard from "@/components/VenueSpaceCard";
import type { HostDetail } from "@repo/types";

async function getHost(
  id: string
): Promise<{ notFound: boolean; error: boolean; host: HostDetail | null }> {
  try {
    const res = await fetch(`${PRODUCT_SERVICE_URL}/hosts/${id}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return { notFound: true, error: false, host: null };
    if (!res.ok) return { notFound: false, error: true, host: null };
    return { notFound: false, error: false, host: await res.json() };
  } catch {
    return { notFound: false, error: true, host: null };
  }
}

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function HostProfilePage({ params }: PageProps) {
  const { id } = await params;
  const result = await getHost(id);
  if (result.notFound) notFound();

  const t = await getTranslations("hosts");
  const tCard = await getTranslations("hosts.card");
  const tVenue = await getTranslations("venue");

  if (result.error || !result.host) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold">{t("loadError")}</h1>
        <Link
          href={`/hosts/${id}`}
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-subtle"
        >
          <RefreshCw className="size-4" /> {tVenue("retry")}
        </Link>
      </div>
    );
  }

  const host = result.host;
  const displayName = host.name ?? host.username;
  const initials = displayName.slice(0, 1).toUpperCase();
  const hostingYear = host.hostingSince ? new Date(host.hostingSince).getFullYear() : null;
  const hostBadges = [
    {
      visible: host.hostSponsored,
      label: tVenue("sponsored"),
      icon: Megaphone,
    },
    {
      visible: host.hostRecommended,
      label: tVenue("recommended"),
      icon: Star,
    },
    {
      visible: host.hostVerified,
      label: tVenue("verified"),
      icon: Check,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <header className="flex flex-col sm:flex-row sm:items-center gap-5 border border-border rounded-2xl p-6">
        {host.image ? (
          <Image
            src={host.image}
            alt={displayName}
            width={96}
            height={96}
            className="rounded-full object-cover size-24"
          />
        ) : (
          <div className="size-24 rounded-full bg-subtle flex items-center justify-center text-3xl font-semibold text-foreground">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{displayName}</h1>
          <div className="text-muted text-sm mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            {hostingYear && <span>{tCard("hostingSince", { year: hostingYear })}</span>}
            <span>
              {tCard("venues", { count: host.venueCount })} ·{" "}
              {tCard("spaces", { count: host.spaceCount })}
            </span>
            {hostBadges.map(({ visible, label, icon: Icon }) =>
              visible ? (
                <span key={label} className="inline-flex items-center gap-1 text-success">
                  <Icon className="size-3.5" /> {label}
                </span>
              ) : null
            )}
          </div>
          {host.bio && (
            <p className="text-muted mt-3 whitespace-pre-line text-pretty">{host.bio}</p>
          )}
        </div>
      </header>

      <section>
        <h2 className="text-2xl font-bold text-foreground mb-4">{t("profile.venues")}</h2>
        {host.venues.length === 0 ? (
          <p className="text-muted">{t("profile.noVenues")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {host.venues.map((venue) => (
              <VenueSpaceCard
                key={venue.id}
                venue={{
                  id: venue.id,
                  name: venue.name,
                  shortDescription: venue.shortDescription,
                  city: venue.city,
                  country: venue.country,
                  images: venue.images,
                  venueVerified: venue.venueVerified,
                  venueRecommended: venue.venueRecommended,
                  venueSponsored: venue.venueSponsored,
                  spaceCount: venue._count?.spaces ?? 0,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
