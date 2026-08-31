import { notFound } from "next/navigation";
import Image from "next/image";
import { AlertCircle, MapPin, RefreshCw, Check, Megaphone, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PRODUCT_SERVICE_URL } from "@/lib/config";
import { parseImages } from "@/lib/utils";
import ImageGallery from "@/components/ImageGallery";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import SpaceCard from "@/components/SpaceCard";
import WorkingHoursDisplay from "@/components/WorkingHoursDisplay";
import { hostProfileHref, type VenueDetail } from "@repo/types";

type VenueDetailResponse = VenueDetail;

async function getVenue(
  id: string,
  locale?: string
): Promise<{ error: boolean; notFound: boolean; venue: VenueDetailResponse | null }> {
  try {
    const langParam = locale && locale !== "en" ? `?lang=${locale}` : "";
    const res = await fetch(`${PRODUCT_SERVICE_URL}/venues/${id}${langParam}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return { error: false, notFound: true, venue: null };
    if (!res.ok) return { error: true, notFound: false, venue: null };
    return { error: false, notFound: false, venue: await res.json() };
  } catch {
    return { error: true, notFound: false, venue: null };
  }
}

interface PageProps {
  params: Promise<{ id: string; locale: string }>;
}

export default async function VenueDetailPage({ params }: PageProps) {
  const { id, locale } = await params;
  const result = await getVenue(id, locale);

  if (result.notFound) notFound();

  const t = await getTranslations("venue");

  if (result.error || !result.venue) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{t("detailLoadError")}</h1>
        <Link
          href={`/venues/${id}`}
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-subtle"
        >
          <RefreshCw className="size-4" />
          {t("retry")}
        </Link>
      </div>
    );
  }

  const venue = result.venue;
  const images = parseImages(venue.images);
  const hostingYear = venue.host.hostingSince
    ? new Date(venue.host.hostingSince).getFullYear()
    : null;
  const venueBadges = [
    {
      visible: venue.venueSponsored,
      label: t("sponsored"),
      icon: Megaphone,
      className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    },
    {
      visible: venue.venueRecommended,
      label: t("recommended"),
      icon: Star,
      className: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    },
    {
      visible: venue.venueVerificationStatus === "VERIFIED",
      label: t("verifiedVenue"),
      icon: Check,
      className: "bg-green-500/10 text-green-700 border-green-500/30",
    },
  ];
  const hostBadges = [
    {
      visible: venue.host.hostSponsored,
      label: t("sponsored"),
      icon: Megaphone,
    },
    {
      visible: venue.host.hostRecommended,
      label: t("recommended"),
      icon: Star,
    },
    {
      visible: venue.host.hostVerificationStatus === "VERIFIED",
      label: t("verified"),
      icon: Check,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
          {venue.name}
        </h1>
        {venueBadges.some((badge) => badge.visible) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {venueBadges.map(({ visible, label, icon: Icon, className }) =>
              visible ? (
                <span
                  key={label}
                  className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}
                >
                  <Icon className="size-3.5" />
                  <span className="truncate">{label}</span>
                </span>
              ) : null
            )}
          </div>
        )}
        <p className="text-muted mt-2 flex items-center gap-1.5">
          <MapPin className="size-4" />
          {venue.address}, {venue.city}, {venue.country}
        </p>
      </div>

      {images.length > 0 && <ImageGallery images={images} spaceName={venue.name} />}

      {venue.videoUrl && (
        <YouTubeEmbed url={venue.videoUrl} title={venue.name} />
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {venue.description && (
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">{t("about")}</h2>
              <p className="text-muted whitespace-pre-line text-pretty">{venue.description}</p>
            </section>
          )}

          {venue.workingHours && (
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {t("workingHours.title")}
              </h2>
              <WorkingHoursDisplay hours={venue.workingHours} />
            </section>
          )}
        </div>

        <aside className="border border-border rounded-2xl p-5 h-fit space-y-3">
          <div className="flex items-center gap-3">
            {venue.host.image ? (
              <Image
                src={venue.host.image}
                alt={venue.host.name ?? venue.host.username}
                width={56}
                height={56}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="size-14 rounded-full bg-subtle flex items-center justify-center text-foreground font-semibold">
                {(venue.host.name ?? venue.host.username).slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-foreground line-clamp-1">
                {t("hostedBy", { name: venue.host.name ?? venue.host.username })}
              </p>
              {hostingYear && (
                <p className="text-xs text-muted">
                  {t("hostingSince", { year: hostingYear })}
                </p>
              )}
              {hostBadges.some((badge) => badge.visible) && (
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {hostBadges.map(({ visible, label, icon: Icon }) =>
                    visible ? (
                      <span
                        key={label}
                        className="inline-flex max-w-full items-center gap-1 text-xs text-success"
                      >
                        <Icon className="size-3.5" />
                        <span className="truncate">{label}</span>
                      </span>
                    ) : null
                  )}
                </div>
              )}
            </div>
          </div>
          {venue.host.bio && (
            <p className="text-sm text-muted whitespace-pre-line">{venue.host.bio}</p>
          )}
          <Link
            href={hostProfileHref(venue.host)}
            className="inline-flex items-center justify-center w-full px-3 py-2 border border-border rounded-lg text-sm font-medium hover:bg-subtle transition-colors"
          >
            {t("viewHost")}
          </Link>
        </aside>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-foreground mb-4">{t("spaces")}</h2>
        {venue.spaces.length === 0 ? (
          <p className="text-muted">{t("noSpaces")}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {venue.spaces.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
