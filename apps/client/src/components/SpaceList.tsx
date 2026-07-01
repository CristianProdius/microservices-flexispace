import { Space } from "@repo/types";
import SpaceCategories from "./SpaceCategories";
import SpaceCard from "./SpaceCard";
import SpaceListBrowse from "./SpaceListBrowse";
import { AlertCircle, RefreshCw, Search } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { getBrowseTaxonomy } from "@/lib/taxonomy.server";
import {
  buildBrowseHref,
  resolveBrowseSelection,
  type BrowseTaxonomy,
} from "@/lib/taxonomy";
import { PRODUCT_SERVICE_URL } from "@/lib/config";

export type SpaceWithCategory = Space & {
  category?: {
    group?: {
      name?: string | null;
      slug?: string | null;
      sortOrder?: number | null;
    } | null;
    groupSlug?: string | null;
    name?: string | null;
    slug?: string | null;
  } | null;
  venue?: {
    id: number;
    name: string;
    city: string;
    country: string;
  } | null;
};

interface FetchParams {
  category?: string;
  categorySlug?: string;
  type?: string;
  group?: string;
  groupSlug?: string;
  city?: string;
  capacity?: string;
  minPrice?: string;
  maxPrice?: string;
  instantBook?: string;
  sort?: string;
  limit?: string;
  lang?: string;
}

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FetchResult {
  spaces: SpaceWithCategory[];
  pagination: PaginationData;
  apiParams: string;
  error: boolean;
}

const emptyPagination = { page: 1, limit: 20, total: 0, totalPages: 0 };

const fetchSpaces = async (
  params: FetchParams,
  taxonomy: BrowseTaxonomy
): Promise<FetchResult> => {
  const searchParams = new URLSearchParams();
  const hasExplicitTaxonomyParams = Boolean(
    params.category ||
      params.categorySlug ||
      params.group ||
      params.groupSlug
  );
  const browseSelection = resolveBrowseSelection(
    {
      category: params.category,
      categorySlug: params.categorySlug,
      group: params.group,
      groupSlug: params.groupSlug,
      type: params.type,
    },
    taxonomy
  );

  if (params.type && !hasExplicitTaxonomyParams) {
    searchParams.set("spaceType", params.type);
  } else if (browseSelection.categorySlug) {
    searchParams.set("categorySlug", browseSelection.categorySlug);
  } else if (browseSelection.groupSlug) {
    searchParams.set("groupSlug", browseSelection.groupSlug);
  } else if (browseSelection.legacySpaceType) {
    searchParams.set("spaceType", browseSelection.legacySpaceType);
  }
  if (params.city) searchParams.set("city", params.city);
  if (params.capacity) searchParams.set("capacity", params.capacity);
  if (params.minPrice) searchParams.set("minPrice", params.minPrice);
  if (params.maxPrice) searchParams.set("maxPrice", params.maxPrice);
  if (params.instantBook) searchParams.set("instantBook", params.instantBook);
  if (params.sort) searchParams.set("sort", params.sort);
  if (params.limit) searchParams.set("limit", params.limit);
  if (params.lang) searchParams.set("lang", params.lang);

  const apiParams = searchParams.toString();
  const url = `${PRODUCT_SERVICE_URL}/spaces?${apiParams}`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      console.error("Failed to fetch spaces:", res.status);
      return { spaces: [], pagination: emptyPagination, apiParams, error: true };
    }
    const data = await res.json();
    return {
      spaces: data.spaces || data || [],
      pagination: data.pagination || emptyPagination,
      apiParams,
      error: false,
    };
  } catch (error) {
    console.error("Error fetching spaces:", error);
    return { spaces: [], pagination: emptyPagination, apiParams, error: true };
  }
};

interface SpaceListProps {
  category?: string;
  categorySlug?: string;
  type?: string;
  group?: string;
  groupSlug?: string;
  city?: string;
  capacity?: string;
  minPrice?: string;
  maxPrice?: string;
  instantBook?: string;
  sort?: string;
  variant: "homepage" | "browse";
  showCategories?: boolean;
  locale?: string;
}

const SpaceList = async ({
  type,
  category,
  categorySlug,
  group,
  groupSlug,
  city,
  capacity,
  minPrice,
  maxPrice,
  instantBook,
  sort,
  variant,
  showCategories = true,
  locale,
}: SpaceListProps) => {
  const taxonomy = await getBrowseTaxonomy();
  const browseSelection = resolveBrowseSelection(
    { category, categorySlug, group, groupSlug, type },
    taxonomy
  );
  const result = await fetchSpaces({
    category,
    categorySlug,
    group,
    groupSlug,
    city,
    capacity,
    minPrice,
    maxPrice,
    instantBook,
    type,
    // AUD-B1: both homepage and browse lead with recommended/sponsored inventory
    // (the "featured" sort: venue/host sponsored → recommended → verified → newest)
    // so admin "Recommended" toggles surface spaces at the front. Browse's
    // SpaceFilter offers "featured" as its default (no-param) sort option, so the
    // SSR initial fetch here must default to "featured" too for the two to agree.
    sort: sort || "featured",
    limit: variant === "homepage" ? "8" : "20",
    lang: locale,
  }, taxonomy);

  const t = await getTranslations("spaces");
  const tc = await getTranslations("common");

  if (variant === "browse") {
    return (
      <div className="w-full">
        <SpaceListBrowse
          initialSpaces={result.spaces}
          initialPagination={result.pagination}
          initialApiParams={result.apiParams}
          initialError={result.error}
          taxonomy={taxonomy}
          browseSelection={browseSelection}
        />
      </div>
    );
  }

  // Homepage variant — keep original rendering
  const spaces = result.spaces;
  return (
    <div className="w-full">
      {showCategories && (
        <SpaceCategories selection={browseSelection} taxonomy={taxonomy} />
      )}

      {result.error ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-foreground text-lg font-medium">{t("serviceError")}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-subtle transition-colors"
          >
            <RefreshCw className="size-4" />
            {t("retry")}
          </Link>
        </div>
      ) : spaces.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-subtle flex items-center justify-center">
            <Search className="w-8 h-8 text-muted" />
          </div>
          <p className="text-muted text-lg">{t("noSpacesFound")}</p>
          <p className="text-muted mt-2">{t("tryAdjusting")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {spaces.map((space) => (
            <SpaceCard key={space.id} space={space} />
          ))}
        </div>
      )}

      {spaces.length > 0 && (
        <div className="flex justify-center mt-8">
          <Link
            href={buildBrowseHref(browseSelection)}
            className="px-6 py-3 border border-foreground text-foreground rounded-lg font-medium hover:bg-foreground hover:text-white transition-colors"
          >
            {tc("viewAllSpaces")}
          </Link>
        </div>
      )}
    </div>
  );
};

export default SpaceList;
