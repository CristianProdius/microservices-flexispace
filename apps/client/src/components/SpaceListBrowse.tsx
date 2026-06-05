"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { AlertCircle, LayoutGrid, Loader2, Map as MapIcon, RefreshCw, Search } from "lucide-react";
import SpaceCard from "./SpaceCard";
import SpaceCategories from "./SpaceCategories";
import SpaceFilter from "./SpaceFilter";
import type { SpaceWithCategory, PaginationData } from "./SpaceList";
import type { BrowseSelection, BrowseTaxonomy } from "@/lib/taxonomy";
import { PRODUCT_SERVICE_URL } from "@/lib/config";

const SpaceMapDynamic = dynamic(() => import("./SpaceMap"), { ssr: false });

interface SpaceListBrowseProps {
  initialSpaces: SpaceWithCategory[];
  initialPagination: PaginationData;
  initialApiParams: string;
  initialError: boolean;
  taxonomy: BrowseTaxonomy;
  browseSelection: BrowseSelection;
}

const STORAGE_KEY_PREFIX = "spacefly_browse_";

export default function SpaceListBrowse({
  initialSpaces,
  initialPagination,
  initialApiParams,
  initialError,
  taxonomy,
  browseSelection,
}: SpaceListBrowseProps) {
  const searchParams = useSearchParams();
  const t = useTranslations("spaces");

  const [spaces, setSpaces] = useState(initialSpaces);
  const [page, setPage] = useState(initialPagination.page);
  const [total, setTotal] = useState(initialPagination.total);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialPagination.page < initialPagination.totalPages
  );
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [mapSpaces, setMapSpaces] = useState<SpaceWithCategory[]>([]);
  const [mapLoading, setMapLoading] = useState(false);
  const [loadError, setLoadError] = useState(initialError);
  const [mapError, setMapError] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevParamsRef = useRef(searchParams.toString());
  const isLoadingRef = useRef(false);
  const apiParamsRef = useRef(initialApiParams);

  // Cache key scoped to locale + search params to prevent cross-locale contamination
  const locale = typeof window !== "undefined" ? window.location.pathname.split("/")[1] || "en" : "en";
  const cacheKey = STORAGE_KEY_PREFIX + locale + "_" + searchParams.toString();
  // Tracks the cacheKey that the current `spaces` state was loaded for. Used
  // to skip the save effect on the first render after a filter change, when
  // `cacheKey` has already updated but `spaces` still holds the old filter's
  // data (which would otherwise be persisted under the new key).
  const spacesOwnerKeyRef = useRef(cacheKey);

  // Restore from sessionStorage on mount (back-button support)
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const {
          spaces: cachedSpaces,
          page: cachedPage,
          total: cachedTotal,
          scrollY,
        } = JSON.parse(cached);
        if (cachedSpaces?.length > initialSpaces.length) {
          setSpaces(cachedSpaces);
          setPage(cachedPage);
          setTotal(cachedTotal);
          setHasMore(cachedSpaces.length < cachedTotal);
          spacesOwnerKeyRef.current = cacheKey;
          // Restore scroll position after layout settles
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              window.scrollTo(0, scrollY || 0);
            });
          });
        }
      }
    } catch {
      // Ignore storage errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-only to restore cached state
  }, []);

  // Save to sessionStorage when spaces change.
  // Skip when the current `spaces` state was loaded for a different cacheKey —
  // otherwise the brief window between a searchParams change updating
  // `cacheKey` and the reset-effect refreshing `spaces` pollutes the new
  // filter's cache with the previous filter's results.
  useEffect(() => {
    if (spaces.length === 0) return;
    if (spacesOwnerKeyRef.current !== cacheKey) return;
    try {
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({
          spaces,
          page,
          total,
          scrollY: window.scrollY,
        })
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [spaces, page, total, cacheKey]);

  // Reset when search params change (filter applied)
  useEffect(() => {
    const currentParams = searchParams.toString();
    if (prevParamsRef.current !== currentParams) {
      prevParamsRef.current = currentParams;
      apiParamsRef.current = initialApiParams;
      // Server component will re-render with new initialSpaces
      setSpaces(initialSpaces);
      setPage(initialPagination.page);
      setTotal(initialPagination.total);
      setHasMore(initialPagination.page < initialPagination.totalPages);
      setLoadError(initialError);
      // The newly-reset `spaces` belong to the new cacheKey; mark it as the
      // owner so subsequent save-effects persist under the right key.
      spacesOwnerKeyRef.current = cacheKey;
    }
  }, [searchParams, initialSpaces, initialPagination, initialApiParams, initialError, cacheKey]);

  // Fetch next page using resolved API params (not raw browser searchParams)
  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;

    isLoadingRef.current = true;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const params = new URLSearchParams(apiParamsRef.current);
      params.set("page", String(nextPage));
      params.set("limit", "20");
      const locale = window.location.pathname.split("/")[1] || "en";
      params.set("lang", locale);

      const url = `${PRODUCT_SERVICE_URL}/spaces?${params.toString()}`;
      const res = await fetch(url);

      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      const newSpaces = data.spaces || [];

      setSpaces((prev) => {
        // Deduplicate by id
        const existingIds = new Set(prev.map((s) => s.id));
        const unique = newSpaces.filter(
          (s: SpaceWithCategory) => !existingIds.has(s.id)
        );
        return [...prev, ...unique];
      });
      setPage(nextPage);
      setTotal(data.pagination?.total ?? total);
      setHasMore(nextPage < (data.pagination?.totalPages ?? 0));
      setLoadError(false);
    } catch (err) {
      console.error("Error loading more spaces:", err);
      setLoadError(true);
    } finally {
      isLoadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [hasMore, page, total]);

  const fetchMapSpaces = useCallback(async (bounds: { neLat: number; neLng: number; swLat: number; swLng: number }) => {
    setMapLoading(true);
    setMapError(false);
    try {
      const params = new URLSearchParams(apiParamsRef.current);
      params.set("neLat", String(bounds.neLat));
      params.set("neLng", String(bounds.neLng));
      params.set("swLat", String(bounds.swLat));
      params.set("swLng", String(bounds.swLng));
      params.set("limit", "100");
      const locale = window.location.pathname.split("/")[1] || "en";
      params.set("lang", locale);
      const url = `${PRODUCT_SERVICE_URL}/spaces?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setMapSpaces(data.spaces || []);
    } catch (err) {
      console.error("Error fetching map spaces:", err);
      setMapError(true);
    } finally {
      setMapLoading(false);
    }
  }, []);

  // IntersectionObserver on sentinel
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);

  // Save scroll position before unload (for back-button)
  useEffect(() => {
    const handleScroll = () => {
      if (spaces.length > 0) {
        try {
          const existing = sessionStorage.getItem(cacheKey);
          if (existing) {
            const parsed = JSON.parse(existing);
            parsed.scrollY = window.scrollY;
            sessionStorage.setItem(cacheKey, JSON.stringify(parsed));
          }
        } catch {
          // Ignore
        }
      }
    };

    // Debounce scroll saving
    let timer: ReturnType<typeof setTimeout>;
    const debouncedScroll = () => {
      clearTimeout(timer);
      timer = setTimeout(handleScroll, 200);
    };

    window.addEventListener("scroll", debouncedScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", debouncedScroll);
    };
  }, [spaces, cacheKey]);

  const shown = spaces.length;

  return (
    <>
      <SpaceCategories selection={browseSelection} taxonomy={taxonomy} />
      <SpaceFilter />

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setViewMode("list")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
            viewMode === "list" ? "bg-primary text-white border-primary" : "border-border text-muted hover:text-foreground"
          }`}
        >
          <LayoutGrid className="size-4" />
          {t("listView")}
        </button>
        <button
          onClick={() => setViewMode("map")}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
            viewMode === "map" ? "bg-primary text-white border-primary" : "border-border text-muted hover:text-foreground"
          }`}
        >
          <MapIcon className="size-4" />
          {t("mapView")}
        </button>
      </div>

      {viewMode === "map" ? (
        <div className="h-[calc(100vh-280px)] min-h-[500px] rounded-xl overflow-hidden border border-border relative">
          <SpaceMapDynamic
            spaces={mapSpaces.length > 0 ? mapSpaces : spaces}
            onBoundsChange={fetchMapSpaces}
            isLoading={mapLoading}
          />
          {mapError && (
            <div className="absolute left-4 right-4 top-4 rounded-lg border border-red-500/20 bg-background/95 p-3 text-sm text-red-700 shadow-sm">
              {t("mapLoadError")}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Results count */}
          {total > 0 && (
            <p className="text-sm text-muted mb-4">
              {t("showingResults", { shown, total })}
            </p>
          )}

          {loadError && spaces.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-foreground text-lg font-medium">{t("serviceError")}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-subtle transition-colors"
              >
                <RefreshCw className="size-4" />
                {t("retry")}
              </button>
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
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {spaces.map((space) => (
                  <SpaceCard key={space.id} space={space} />
                ))}
              </div>

              {/* Loading spinner */}
              {isLoadingMore && (
                <div className="flex items-center justify-center py-8 gap-2 text-muted">
                  <Loader2 className="size-5 animate-spin" />
                  <span className="text-sm">{t("loadingMore")}</span>
                </div>
              )}

              {loadError && (
                <div className="flex items-center justify-center py-6">
                  <button
                    type="button"
                    onClick={loadMore}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-subtle transition-colors"
                  >
                    <RefreshCw className="size-4" />
                    {t("loadMoreError")}
                  </button>
                </div>
              )}

              {/* End of results */}
              {!hasMore && spaces.length > 0 && (
                <p className="text-center text-sm text-muted py-8">
                  {t("noMoreResults")}
                </p>
              )}

              {/* Sentinel for IntersectionObserver */}
              {hasMore && <div ref={sentinelRef} className="h-1" />}
            </>
          )}
        </>
      )}
    </>
  );
}
