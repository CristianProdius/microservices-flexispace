import { SpaceWithHost } from "@repo/types";
import { notFound } from "next/navigation";
import Image from "next/image";
import {
  AlertCircle,
  MapPin,
  Users,
  Star,
  Check,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import BookingForm from "./BookingForm";
import ReviewSection from "./ReviewSection";
import LocationMapLoader from "./LocationMapLoader";
import { getTranslations } from "next-intl/server";
import { PRODUCT_SERVICE_URL } from "@/lib/config";
import { parseImages, formatPrice, getPriceDisplay } from "@/lib/utils";
import { hasBookablePrice } from "@/lib/pricing-availability";
import { getSpaceCategoryLabel } from "@/lib/taxonomy";
import { Link } from "@/i18n/navigation";
import ImageGallery from "@/components/ImageGallery";
import YouTubeEmbed from "@/components/YouTubeEmbed";

async function getSpace(
  id: string,
  locale?: string,
): Promise<{
  error: boolean;
  notFound: boolean;
  space: SpaceWithHost | null;
}> {
  try {
    const langParam = locale && locale !== "en" ? `?lang=${locale}` : "";
    const res = await fetch(`${PRODUCT_SERVICE_URL}/spaces/${id}${langParam}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404)
      return { error: false, notFound: true, space: null };
    if (!res.ok) return { error: true, notFound: false, space: null };
    return { error: false, notFound: false, space: await res.json() };
  } catch {
    return { error: true, notFound: false, space: null };
  }
}

interface SpaceDetailPageProps {
  params: Promise<{ id: string; locale: string }>;
}

const SpaceDetailPage = async ({ params }: SpaceDetailPageProps) => {
  const { id, locale } = await params;
  const result = await getSpace(id, locale);

  if (result.notFound) {
    notFound();
  }

  const t = await getTranslations("spaces");
  const tCancellation = await getTranslations("cancellation");
  const tCommon = await getTranslations("common");
  const space = result.space;

  if (result.error || !space) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-foreground text-balance">
          {t("detailLoadError")}
        </h1>
        <p className="text-muted mt-2 text-pretty">{t("serviceError")}</p>
        <Link
          href={`/spaces/${id}`}
          className="inline-flex items-center gap-2 mt-6 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-subtle transition-colors"
        >
          <RefreshCw className="size-4" />
          {t("retry")}
        </Link>
      </div>
    );
  }

  const images = parseImages(space.images);
  const categoryLabel = getSpaceCategoryLabel(space);

  const hostName = space.host?.name || tCommon("unknown");
  const hostInitials = hostName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const cancellationPolicy = space.cancellationPolicy;
  const cancellationLabel = [
    "FLEXIBLE",
    "MODERATE",
    "STRICT",
    "NON_REFUNDABLE",
  ].includes(cancellationPolicy)
    ? tCancellation(
        cancellationPolicy as
          | "FLEXIBLE"
          | "MODERATE"
          | "STRICT"
          | "NON_REFUNDABLE",
      )
    : cancellationPolicy;
  const cancellationDesc = [
    "FLEXIBLE",
    "MODERATE",
    "STRICT",
    "NON_REFUNDABLE",
  ].includes(cancellationPolicy)
    ? tCancellation(
        `${cancellationPolicy}_DESC` as
          | "FLEXIBLE_DESC"
          | "MODERATE_DESC"
          | "STRICT_DESC"
          | "NON_REFUNDABLE_DESC",
      )
    : t("contactHostForDetails");

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Image Gallery */}
      <ImageGallery images={images} spaceName={space.name} />

      {(space as any).videoUrl && (
        <div className="mb-8">
          <YouTubeEmbed url={(space as any).videoUrl} title={space.name} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 text-sm text-muted mb-2">
              <span className="bg-subtle px-2 py-1 rounded border border-border">
                {categoryLabel || t(`spaceTypes.${space.spaceType}`)}
              </span>
              {space.instantBook && (
                <span className="bg-success/10 text-success px-2 py-1 rounded border border-success/20">
                  {tCommon("instantBook")}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2 text-balance">
              {space.name}
            </h1>
            {/* Headline price — getPriceDisplay covers HOURLY/DAILY/BOTH and
                MONTHLY (per-month rate with a "/mo" label). */}
            <p className="text-lg font-semibold text-primary mb-2">
              {getPriceDisplay(space)}
            </p>
            {(space as { venue?: { name?: string } | null }).venue?.name &&
              (space as { venue?: { name?: string } | null }).venue!.name !==
                space.name && (
                <p className="text-sm text-muted mb-2">
                  {t("atVenue", {
                    venue: (space as { venue?: { name?: string } | null })
                      .venue!.name!,
                  })}
                </p>
              )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted">
              <div className="flex items-center gap-1">
                <MapPin className="size-4" />
                <span>
                  {space.address}, {space.city}, {space.country}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="size-4" />
                <span>{t("upToGuests", { count: space.capacity })}</span>
              </div>
              {space.averageRating != null && space.averageRating > 0 ? (
                <div className="flex items-center gap-1">
                  <Star className="size-4 fill-primary text-primary" />
                  <span className="font-medium">
                    {space.averageRating.toFixed(1)}
                  </span>
                  <span className="text-muted">
                    ({t("reviewsLabel", { count: space.totalReviews ?? 0 })})
                  </span>
                </div>
              ) : (
                <span className="text-muted text-sm">{t("noReviewsYet")}</span>
              )}
            </div>
          </div>

          {/* Host Info */}
          {space.host?.id ? (
            <Link
              href={`/hosts/${space.host.id}`}
              className="group -m-2 flex items-center gap-4 rounded-xl p-2 transition-colors hover:bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {space.host.image ? (
                <div className="relative size-14 rounded-full overflow-hidden ring-2 ring-primary/20">
                  <Image
                    src={space.host.image}
                    alt={hostName}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="size-14 rounded-full bg-primary-light text-primary ring-2 ring-primary/20 flex items-center justify-center font-semibold text-lg">
                  {hostInitials}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate group-hover:underline">
                  {t("hostedBy", { name: hostName })}
                </p>
                {space.host.hostingSince && (
                  <p className="text-sm text-muted">
                    {t("hostingSince", {
                      year: new Date(space.host.hostingSince).getFullYear(),
                    })}
                  </p>
                )}
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-full bg-primary-light text-primary ring-2 ring-primary/20 flex items-center justify-center font-semibold text-lg">
                {hostInitials}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">
                  {t("hostedBy", { name: hostName })}
                </p>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4 text-balance">
              {t("aboutThisSpace")}
            </h2>
            <p className="text-muted leading-relaxed whitespace-pre-line text-pretty">
              {space.description}
            </p>
          </div>

          {/* Amenities */}
          {space.amenities && space.amenities.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4 text-balance">
                {t("amenities")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {space.amenities.map((sa) => (
                  <span
                    key={sa.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-subtle rounded-full text-sm text-foreground border border-border"
                  >
                    <Check className="size-3.5 text-success" />
                    {sa.amenity.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pricing Tiers */}
          {(space as any).pricingTiers?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4 text-balance">
                {t("pricingTiers")}
              </h2>
              <div className="space-y-2">
                {(space as any).pricingTiers.map((tier: any) => (
                  <div
                    key={tier.id}
                    className="py-2 border-b border-border last:border-0"
                  >
                    <div className="flex justify-between">
                      <span className="text-muted">{tier.label}</span>
                      <span className="font-medium text-foreground">
                        {formatPrice(tier.price, (space as any).currency)}
                      </span>
                    </div>
                    {tier.comment && (
                      <p className="text-sm text-muted mt-1 text-pretty">
                        {tier.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* House Rules */}
          {space.houseRules && (
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4 text-balance">
                {t("houseRules")}
              </h2>
              <p className="text-muted whitespace-pre-line">
                {space.houseRules}
              </p>
            </div>
          )}

          {/* Cancellation Policy */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4 text-balance">
              {t("cancellationPolicy")}
            </h2>
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <RotateCcw className="size-5 text-success" />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {cancellationLabel}
                </p>
                <p className="text-muted text-sm mt-1">{cancellationDesc}</p>
              </div>
            </div>
          </div>

          {/* Location */}
          {space.latitude != null && space.longitude != null && (
            <LocationMapLoader
              latitude={space.latitude}
              longitude={space.longitude}
              address={`${space.address}, ${space.city}, ${space.country}`}
            />
          )}

          {/* Reviews */}
          <ReviewSection spaceId={space.id} />
        </div>

        {/* Booking Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20">
            {hasBookablePrice(space) ? (
              <BookingForm space={space} />
            ) : (
              // A 0/absent hourly-daily rate means the host listed this as
              // "Contact for pricing" — show a contact panel instead of a
              // booking widget that would only fail on submit.
              <div className="rounded-2xl border border-border bg-white p-6 text-center shadow-sm">
                <p className="text-lg font-semibold text-foreground mb-1">
                  {tCommon("contactForPricing")}
                </p>
                <p className="text-sm text-muted text-pretty">
                  {t("contactHostForDetails")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpaceDetailPage;
