"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, RefreshCw } from "lucide-react";
import VenueCard, { type VenueListItem } from "@/components/VenueCard";
import { PRODUCT_SERVICE_URL } from "@/lib/config";

export interface VenueListPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface VenueListBrowseProps {
  initialVenues: VenueListItem[];
  initialPagination: VenueListPagination;
  initialApiParams: string;
}

export default function VenueListBrowse({
  initialVenues,
  initialPagination,
  initialApiParams,
}: VenueListBrowseProps) {
  const searchParams = useSearchParams();
  const t = useTranslations("hosts");

  const [venues, setVenues] = useState(initialVenues);
  const [page, setPage] = useState(initialPagination.page);
  const [total, setTotal] = useState(initialPagination.total);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialPagination.page < initialPagination.totalPages
  );
  const [loadError, setLoadError] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevParamsRef = useRef(searchParams.toString());
  const isLoadingRef = useRef(false);
  const apiParamsRef = useRef(initialApiParams);

  useEffect(() => {
    const currentParams = searchParams.toString();
    if (prevParamsRef.current !== currentParams) {
      prevParamsRef.current = currentParams;
      apiParamsRef.current = initialApiParams;
      setVenues(initialVenues);
      setPage(initialPagination.page);
      setTotal(initialPagination.total);
      setHasMore(initialPagination.page < initialPagination.totalPages);
      setLoadError(false);
    }
  }, [searchParams, initialVenues, initialPagination, initialApiParams]);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;

    isLoadingRef.current = true;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const params = new URLSearchParams(apiParamsRef.current);
      params.set("page", String(nextPage));
      const res = await fetch(`${PRODUCT_SERVICE_URL}/venues?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");

      const data = await res.json();
      const newVenues: VenueListItem[] = data.venues || [];

      setVenues((prev) => {
        const existingIds = new Set(prev.map((venue) => venue.id));
        return [...prev, ...newVenues.filter((venue) => !existingIds.has(venue.id))];
      });
      setPage(nextPage);
      setTotal(data.pagination?.total ?? total);
      setHasMore(nextPage < (data.pagination?.totalPages ?? 0));
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      isLoadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [hasMore, page, total]);

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

  const shown = venues.length;

  return (
    <>
      {total > 0 && (
        <p className="text-sm text-muted mb-4">
          {t("showingResults", { shown, total })}
        </p>
      )}

      {venues.length === 0 ? (
        <p className="text-muted py-12 text-center">{t("empty")}</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {venues.map((venue) => (
              <VenueCard key={venue.id} venue={venue} />
            ))}
          </div>

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
                onClick={() => void loadMore()}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-subtle transition-colors"
              >
                <RefreshCw className="size-4" />
                {t("loadMoreError")}
              </button>
            </div>
          )}

          {!hasMore && venues.length > 0 && (
            <p className="text-center text-sm text-muted py-8">{t("noMoreResults")}</p>
          )}

          {hasMore && <div ref={sentinelRef} className="h-1" />}
        </>
      )}
    </>
  );
}
