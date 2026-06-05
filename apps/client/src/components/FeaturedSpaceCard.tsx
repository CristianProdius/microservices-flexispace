import { Space } from "@repo/types";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { MapPin, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { parseImages, getPriceDisplay, type PriceLabels } from "@/lib/utils";
import { PRODUCT_SERVICE_URL } from "@/lib/config";

const fetchFeaturedSpace = async (): Promise<Space | null> => {
  try {
    const res = await fetch(
      `${PRODUCT_SERVICE_URL}/spaces?sort=newest&limit=1`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const spaces = data.spaces || data || [];
    return spaces[0] || null;
  } catch {
    return null;
  }
};

const FeaturedSpaceCard = async () => {
  const space = await fetchFeaturedSpace();
  const t = await getTranslations("home");
  const tCommon = await getTranslations("common");

  if (!space) {
    return (
      <Link
        href="/spaces"
        className="bg-subtle rounded-2xl border border-border overflow-hidden block p-8 flex flex-col items-center justify-center text-center"
      >
        <p className="text-lg font-semibold text-foreground mb-1">
          {t("featuredBadge")}
        </p>
        <p className="text-sm text-muted mb-4">{t("heroDescription")}</p>
        <span className="px-4 py-2 text-sm font-medium text-white bg-foreground rounded-lg">
          {tCommon("browseSpaces")}
        </span>
      </Link>
    );
  }

  const images = parseImages(space.images);
  const priceLabels: PriceLabels = {
    perHr: tCommon("perHour"),
    perDay: tCommon("perDay"),
    from: tCommon("from"),
    contactForPricing: tCommon("contactForPricing"),
  };
  const priceDisplay = getPriceDisplay(space, priceLabels);

  return (
    <Link
      href={`/spaces/${space.id}`}
      className="bg-subtle rounded-2xl border border-border overflow-hidden block"
    >
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-64 h-44 sm:h-auto bg-subtle shrink-0 relative">
          {images[0] ? (
            <Image
              src={images[0]}
              alt={space.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted text-sm">
              {tCommon("noImage")}
            </div>
          )}
          <span className="absolute top-3 left-3 px-2 py-0.5 bg-primary text-white text-[10px] font-semibold rounded-full">
            {t("featuredBadge")}
          </span>
        </div>
        <div className="p-5 flex flex-col justify-center flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-foreground truncate">
            {space.name}
          </h3>
          <div className="flex items-center gap-1.5 text-sm text-muted mt-1">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{space.city}</span>
            {space.averageRating && (
              <>
                <span className="text-border mx-1">|</span>
                <Star className="size-3.5 text-primary shrink-0" fill="currentColor" />
                <span>
                  {space.averageRating}
                  {space.totalReviews ? ` (${space.totalReviews})` : ""}
                </span>
              </>
            )}
          </div>
          <p className="text-sm text-muted mt-2 line-clamp-2 text-pretty">
            {space.shortDescription}
          </p>
          <div className="flex items-center justify-between mt-4">
            <span className="text-xl font-bold text-foreground tabular-nums">
              {priceDisplay}
            </span>
            <span className="px-4 py-2 text-sm font-medium text-white bg-foreground rounded-lg">
              {tCommon("viewDetails")}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default FeaturedSpaceCard;
