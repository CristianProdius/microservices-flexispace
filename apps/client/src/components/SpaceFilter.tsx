"use client";

import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  ChevronDown,
  X,
  SlidersHorizontal,
  Users,
  DollarSign,
  Zap,
  ArrowUpDown,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Popover } from "@base-ui/react/popover";
import { Drawer } from "@base-ui/react/drawer";
import { cn } from "@/lib/utils";

/* ── Styling constants ─────────────────────────────────────── */

const pillBase =
  "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer";
const pillActive = "bg-primary-light border-primary/30 text-foreground";
const pillInactive =
  "border-border text-muted hover:bg-subtle hover:text-foreground";
const popoverPanel =
  "min-w-[200px] bg-white border border-border rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] p-2 z-50";
const optionBase =
  "w-full text-left px-3 py-2 text-sm rounded-md transition-colors cursor-pointer";
const optionActive = "bg-primary-light text-foreground font-medium";
const optionInactive = "text-foreground hover:bg-subtle";

/* ── Option data ───────────────────────────────────────────── */

const capacityOptions = [
  { value: "", key: "any" as const },
  { value: "1", key: "onePlus" as const },
  { value: "5", key: "fivePlus" as const },
  { value: "10", key: "tenPlus" as const },
  { value: "20", key: "twentyPlus" as const },
  { value: "50", key: "fiftyPlus" as const },
  { value: "100", key: "hundredPlus" as const },
];

const bookingOptions = [
  { value: "", key: "any" as const },
  { value: "true", key: "instantBookOnly" as const },
  { value: "false", key: "requestToBook" as const },
];

// AUD-B1: "featured" (venue/host sponsored → recommended → verified → newest)
// is the browse default, mirroring the homepage and HostFilter. Its label reuses
// the existing `venue.recommended` message (see sortOptions built inside the
// component, which needs the translators). Selecting it writes NO `sort` URL
// param (featured is the no-param default), like the other filter defaults.
const FEATURED_SORT = "featured";

/* ── Component ─────────────────────────────────────────────── */

const SpaceFilter = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("filters");
  // AUD-B1: reuse the existing `venue.recommended` label for the featured sort
  // (no dedicated `filters.recommended`/`filters.featured` key exists yet).
  const tVenue = useTranslations("venue");
  const [drawerOpen, setDrawerOpen] = useState(false);

  // AUD-B1: featured is the FIRST option and the default. Built inside the
  // component so the featured label can come from the `venue` namespace while
  // the rest stay in `filters`.
  const sortOptions = [
    { value: FEATURED_SORT, label: tVenue("recommended") },
    { value: "newest", label: t("newestFirst") },
    { value: "price_asc", label: t("priceLowToHigh") },
    { value: "price_desc", label: t("priceHighToLow") },
    { value: "rating", label: t("highestRated") },
  ];

  /* Drawer-local state (applied on "Show results") */
  const [draftCapacity, setDraftCapacity] = useState("");
  const [draftMinPrice, setDraftMinPrice] = useState("");
  const [draftMaxPrice, setDraftMaxPrice] = useState("");
  const [draftInstantBook, setDraftInstantBook] = useState("");
  const [draftSort, setDraftSort] = useState(FEATURED_SORT);

  /* Price debounce ref */
  const priceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (priceTimerRef.current) clearTimeout(priceTimerRef.current);
    };
  }, []);

  /* ── Derived state from URL ────────────────────────────── */

  const activeCity = searchParams.get("city");
  const activeCapacity = searchParams.get("capacity");
  const activeMinPrice = searchParams.get("minPrice");
  const activeMaxPrice = searchParams.get("maxPrice");
  const activeInstantBook = searchParams.get("instantBook");
  // AUD-B1: default to featured (matches SpaceList's browse SSR default) when no
  // explicit sort is in the URL.
  const activeSort = searchParams.get("sort") || FEATURED_SORT;

  const activeFilterCount = [
    activeCity,
    activeCapacity,
    activeMinPrice,
    activeMaxPrice,
    activeInstantBook,
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  /* ── URL helpers ───────────────────────────────────────── */

  const updateParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}` as any, { scroll: false });
  };

  const updateMultipleParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    router.push(`${pathname}?${params.toString()}` as any, { scroll: false });
  };

  const clearFilters = () => {
    router.push(pathname, { scroll: false });
  };

  const removeFilter = (key: string) => {
    updateParams(key, null);
  };

  /* ── Handlers ──────────────────────────────────────────── */

  const handleCitySearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const city = formData.get("city") as string;
    updateParams("city", city || null);
  };

  const handlePriceChange = (key: "minPrice" | "maxPrice", value: string) => {
    if (priceTimerRef.current) clearTimeout(priceTimerRef.current);
    priceTimerRef.current = setTimeout(() => {
      updateParams(key, value || null);
    }, 500);
  };

  const syncDraftFromUrl = () => {
    setDraftCapacity(activeCapacity || "");
    setDraftMinPrice(activeMinPrice || "");
    setDraftMaxPrice(activeMaxPrice || "");
    setDraftInstantBook(activeInstantBook || "");
    setDraftSort(activeSort);
  };

  const applyDraft = () => {
    updateMultipleParams({
      capacity: draftCapacity || null,
      minPrice: draftMinPrice || null,
      maxPrice: draftMaxPrice || null,
      instantBook: draftInstantBook || null,
      // AUD-B1: featured is the no-param default (mirrors HostFilter).
      sort: draftSort === FEATURED_SORT ? null : draftSort,
    });
    setDrawerOpen(false);
  };

  const clearDraft = () => {
    setDraftCapacity("");
    setDraftMinPrice("");
    setDraftMaxPrice("");
    setDraftInstantBook("");
    setDraftSort(FEATURED_SORT);
  };

  /* ── Label helpers ─────────────────────────────────────── */

  const capacityLabel = activeCapacity
    ? capacityOptions.find((o) => o.value === activeCapacity)?.key
    : null;

  const priceLabel =
    activeMinPrice || activeMaxPrice
      ? `$${activeMinPrice || "0"}–$${activeMaxPrice || "∞"}`
      : null;

  const bookingLabel = activeInstantBook
    ? bookingOptions.find((o) => o.value === activeInstantBook)?.key
    : null;

  const sortLabel = sortOptions.find((o) => o.value === activeSort)?.label;

  /* ── Active filter chips data ──────────────────────────── */

  const chips: { label: string; paramKey: string }[] = [];
  if (activeCity) chips.push({ label: activeCity, paramKey: "city" });
  if (capacityLabel)
    chips.push({ label: t(capacityLabel), paramKey: "capacity" });
  if (priceLabel) {
    chips.push({ label: priceLabel, paramKey: "minPrice" });
  }
  if (bookingLabel)
    chips.push({ label: t(bookingLabel), paramKey: "instantBook" });

  /* ── Render ────────────────────────────────────────────── */

  return (
    <div className="mb-6 space-y-3">
      {/* ═══ DESKTOP BAR (≥md) ═══ */}
      <div className="hidden md:flex items-center gap-2 p-2 bg-white border border-border rounded-[var(--radius-md)] shadow-[var(--shadow-sm)]">
        {/* Search */}
        <form onSubmit={handleCitySearch} className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
            <input
              type="text"
              name="city"
              placeholder={t("searchByCity")}
              defaultValue={activeCity || ""}
              aria-label={t("searchByCity")}
              className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border-none outline-none placeholder:text-muted"
            />
          </div>
        </form>

        {/* Divider */}
        <div className="w-px h-8 bg-border shrink-0" />

        {/* Capacity pill */}
        <Popover.Root>
          <Popover.Trigger
            aria-label={t("capacity")}
            className={cn(pillBase, activeCapacity ? pillActive : pillInactive)}
          >
            <Users className="size-4" />
            <span>{capacityLabel ? t(capacityLabel) : t("capacity")}</span>
            <ChevronDown className="size-3.5" />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="bottom" align="start" sideOffset={4}>
              <Popover.Popup className={popoverPanel}>
                {capacityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateParams("capacity", opt.value || null)}
                    className={cn(
                      optionBase,
                      activeCapacity === opt.value ||
                        (!activeCapacity && !opt.value)
                        ? optionActive
                        : optionInactive
                    )}
                  >
                    {t(opt.key)}
                  </button>
                ))}
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>

        {/* Price pill */}
        <Popover.Root>
          <Popover.Trigger
            aria-label={t("priceRange")}
            className={cn(
              pillBase,
              activeMinPrice || activeMaxPrice ? pillActive : pillInactive
            )}
          >
            <DollarSign className="size-4" />
            <span>{priceLabel || t("priceRange")}</span>
            <ChevronDown className="size-3.5" />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="bottom" align="start" sideOffset={4}>
              <Popover.Popup className={popoverPanel}>
                <div className="flex items-center gap-2 p-1">
                  <input
                    type="number"
                    placeholder={`${t("minPrice")} ($)`}
                    defaultValue={activeMinPrice || ""}
                    onChange={(e) =>
                      handlePriceChange("minPrice", e.target.value)
                    }
                    className="w-24 px-2.5 py-2 text-sm border border-border rounded-md outline-none focus:border-primary/50"
                  />
                  <span className="text-muted">—</span>
                  <input
                    type="number"
                    placeholder={`${t("maxPrice")} ($)`}
                    defaultValue={activeMaxPrice || ""}
                    onChange={(e) =>
                      handlePriceChange("maxPrice", e.target.value)
                    }
                    className="w-24 px-2.5 py-2 text-sm border border-border rounded-md outline-none focus:border-primary/50"
                  />
                </div>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>

        {/* Booking type pill */}
        <Popover.Root>
          <Popover.Trigger
            aria-label={t("bookingType")}
            className={cn(
              pillBase,
              activeInstantBook ? pillActive : pillInactive
            )}
          >
            <Zap className="size-4" />
            <span>
              {bookingLabel ? t(bookingLabel) : t("bookingType")}
            </span>
            <ChevronDown className="size-3.5" />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="bottom" align="start" sideOffset={4}>
              <Popover.Popup className={popoverPanel}>
                {bookingOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      updateParams("instantBook", opt.value || null)
                    }
                    className={cn(
                      optionBase,
                      activeInstantBook === opt.value ||
                        (!activeInstantBook && !opt.value)
                        ? optionActive
                        : optionInactive
                    )}
                  >
                    {t(opt.key)}
                  </button>
                ))}
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sort pill (right-aligned) */}
        <Popover.Root>
          <Popover.Trigger
            aria-label={t("sort")}
            className={cn(
              pillBase,
              // AUD-B1: pill reads "active" only when a non-default (non-featured) sort is chosen.
              activeSort !== FEATURED_SORT ? pillActive : pillInactive
            )}
          >
            <ArrowUpDown className="size-4" />
            <span>{sortLabel ?? t("sort")}</span>
            <ChevronDown className="size-3.5" />
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner side="bottom" align="end" sideOffset={4}>
              <Popover.Popup className={popoverPanel}>
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      updateParams(
                        "sort",
                        // AUD-B1: featured is the no-param default.
                        opt.value === FEATURED_SORT ? null : opt.value
                      )
                    }
                    className={cn(
                      optionBase,
                      activeSort === opt.value ? optionActive : optionInactive
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </div>

      {/* ═══ MOBILE BAR (<md) ═══ */}
      <div className="flex md:hidden items-center gap-2">
        <form onSubmit={handleCitySearch} className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
            <input
              type="text"
              name="city"
              placeholder={t("searchByCity")}
              defaultValue={activeCity || ""}
              aria-label={t("searchByCity")}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg outline-none focus:border-primary/50"
            />
          </div>
        </form>

        <Drawer.Root
          open={drawerOpen}
          onOpenChange={(open) => {
            setDrawerOpen(open);
            if (open) syncDraftFromUrl();
          }}
        >
          <Drawer.Trigger
            className={cn(
              "relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border rounded-lg transition-colors cursor-pointer shrink-0",
              hasActiveFilters
                ? "bg-primary-light border-primary/30 text-foreground"
                : "border-border text-muted"
            )}
          >
            <SlidersHorizontal className="size-4" />
            {t("filters")}
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center bg-primary text-white size-5 rounded-full text-xs font-medium">
                {activeFilterCount}
              </span>
            )}
          </Drawer.Trigger>

          <Drawer.Portal>
            <Drawer.Backdrop className="fixed inset-0 bg-black/40 z-50" />
            <Drawer.Popup className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl max-h-[85dvh] flex flex-col">
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 pb-3 border-b border-border">
                <Drawer.Title className="text-lg font-semibold text-foreground">
                  {t("filters")}
                </Drawer.Title>
                <Drawer.Close
                  aria-label={t("close")}
                  className="p-1.5 text-muted hover:text-foreground cursor-pointer"
                >
                  <X className="size-5" />
                </Drawer.Close>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                {/* Capacity */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">
                    {t("capacity")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {capacityOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setDraftCapacity(opt.value)}
                        className={cn(
                          "px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer",
                          draftCapacity === opt.value ||
                            (!draftCapacity && !opt.value)
                            ? "bg-primary-light border-primary/30 text-foreground font-medium"
                            : "border-border text-muted hover:bg-subtle"
                        )}
                      >
                        {t(opt.key)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">
                    {t("priceRange")}
                  </h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder={`${t("minPrice")} ($)`}
                      value={draftMinPrice}
                      onChange={(e) => setDraftMinPrice(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-border rounded-lg outline-none focus:border-primary/50"
                    />
                    <span className="text-muted">—</span>
                    <input
                      type="number"
                      placeholder={`${t("maxPrice")} ($)`}
                      value={draftMaxPrice}
                      onChange={(e) => setDraftMaxPrice(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-border rounded-lg outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                {/* Booking Type */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">
                    {t("bookingType")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {bookingOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setDraftInstantBook(opt.value)}
                        className={cn(
                          "px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer",
                          draftInstantBook === opt.value ||
                            (!draftInstantBook && !opt.value)
                            ? "bg-primary-light border-primary/30 text-foreground font-medium"
                            : "border-border text-muted hover:bg-subtle"
                        )}
                      >
                        {t(opt.key)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-2">
                    {t("sortBy")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {sortOptions.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setDraftSort(opt.value)}
                        className={cn(
                          "px-3 py-1.5 text-sm rounded-lg border transition-colors cursor-pointer",
                          draftSort === opt.value
                            ? "bg-primary-light border-primary/30 text-foreground font-medium"
                            : "border-border text-muted hover:bg-subtle"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sticky footer */}
              <div className="border-t border-border px-4 py-3 flex items-center justify-between pb-[env(safe-area-inset-bottom,12px)]">
                <button
                  onClick={clearDraft}
                  className="text-sm font-medium text-muted hover:text-foreground transition-colors cursor-pointer"
                >
                  {t("clear")}
                </button>
                <button
                  onClick={applyDraft}
                  className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  {t("showResults")}
                </button>
              </div>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>
      </div>

      {/* ═══ ACTIVE FILTER CHIPS ═══ */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <span
              key={chip.paramKey}
              className="flex items-center gap-1 bg-primary-light text-foreground text-sm rounded-full px-2.5 py-1"
            >
              {chip.label}
              <button
                onClick={() => {
                  if (chip.paramKey === "minPrice") {
                    updateMultipleParams({ minPrice: null, maxPrice: null });
                  } else {
                    removeFilter(chip.paramKey);
                  }
                }}
                aria-label={t("removeFilter", { filter: chip.label })}
                className="ml-0.5 p-0.5 rounded-full hover:bg-primary/10 transition-colors cursor-pointer"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
          <button
            onClick={clearFilters}
            className="text-sm text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            {t("clearAll")}
          </button>
        </div>
      )}
    </div>
  );
};

export default SpaceFilter;
