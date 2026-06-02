"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Popover } from "@base-ui/react/popover";
import {
  ArrowUpDown,
  BadgeCheck,
  ChevronDown,
  MapPin,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Styling constants (mirror SpaceFilter) ───────────────── */

const pillBase =
  "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer shrink-0";
const pillActive = "bg-primary-light border-primary/30 text-foreground";
const pillInactive =
  "border-border text-muted hover:bg-subtle hover:text-foreground";
const popoverPanel =
  "min-w-[200px] bg-white border border-border rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] p-2 z-50";
const optionBase =
  "w-full text-left px-3 py-2 text-sm rounded-md transition-colors cursor-pointer";
const optionActive = "bg-primary-light text-foreground font-medium";
const optionInactive = "text-foreground hover:bg-subtle";

/* ── Sort options ─────────────────────────────────────────── */

const SORT_KEYS = ["featured", "mostVenues", "newest"] as const;
type SortKey = (typeof SORT_KEYS)[number];
const DEFAULT_SORT: SortKey = "featured";

const isSortKey = (value: string | null): value is SortKey =>
  SORT_KEYS.includes(value as SortKey);

interface HostFilterProps {
  availableCities: string[];
}

export default function HostFilter({ availableCities }: HostFilterProps) {
  const t = useTranslations("hosts.filters");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCity = searchParams.get("city") ?? "";
  const activeVerified = searchParams.get("verified") === "true";
  const activeSortRaw = searchParams.get("sort");
  const activeSort: SortKey = isSortKey(activeSortRaw) ? activeSortRaw : DEFAULT_SORT;
  const activeSearch = searchParams.get("search") ?? "";

  const [searchDraft, setSearchDraft] = useState(activeSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchDraft(activeSearch);
  }, [activeSearch]);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  const writeParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value && value.length > 0) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const onSearchChange = (value: string) => {
    setSearchDraft(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      writeParam("search", value.trim() || null);
    }, 300);
  };

  const onClear = () => {
    setSearchDraft("");
    router.replace(pathname);
  };

  const hasAnyFilter =
    Boolean(activeCity) ||
    activeVerified ||
    Boolean(activeSearch) ||
    activeSort !== DEFAULT_SORT;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 p-2 bg-white border border-border rounded-[var(--radius-md)] shadow-[var(--shadow-sm)]">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
        <input
          type="search"
          value={searchDraft}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="w-full pl-9 pr-3 py-2 text-sm bg-transparent border-none outline-none placeholder:text-muted"
        />
      </div>

      {/* Divider */}
      <div className="hidden md:block w-px h-8 bg-border shrink-0" />

      {/* City pill */}
      <Popover.Root>
        <Popover.Trigger
          aria-label={t("allCities")}
          className={cn(pillBase, activeCity ? pillActive : pillInactive)}
        >
          <MapPin className="size-4" />
          <span>{activeCity || t("allCities")}</span>
          <ChevronDown className="size-3.5" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="bottom" align="start" sideOffset={4}>
            <Popover.Popup className={cn(popoverPanel, "max-h-72 overflow-auto")}>
              <button
                type="button"
                onClick={() => writeParam("city", null)}
                className={cn(optionBase, !activeCity ? optionActive : optionInactive)}
              >
                {t("allCities")}
              </button>
              {availableCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => writeParam("city", city)}
                  className={cn(
                    optionBase,
                    activeCity === city ? optionActive : optionInactive
                  )}
                >
                  {city}
                </button>
              ))}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      {/* Verified toggle */}
      <button
        type="button"
        onClick={() => writeParam("verified", activeVerified ? null : "true")}
        aria-pressed={activeVerified}
        className={cn(pillBase, activeVerified ? pillActive : pillInactive)}
      >
        <BadgeCheck className="size-4" />
        <span>{t("verifiedOnly")}</span>
      </button>

      {/* Spacer */}
      <div className="hidden md:block flex-1" />

      {/* Sort pill (right-aligned on desktop) */}
      <Popover.Root>
        <Popover.Trigger
          aria-label={t("sort.label")}
          className={cn(
            pillBase,
            activeSort !== DEFAULT_SORT ? pillActive : pillInactive
          )}
        >
          <ArrowUpDown className="size-4" />
          <span>{t("sort." + activeSort)}</span>
          <ChevronDown className="size-3.5" />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner side="bottom" align="end" sideOffset={4}>
            <Popover.Popup className={popoverPanel}>
              {SORT_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    writeParam("sort", key === DEFAULT_SORT ? null : key)
                  }
                  className={cn(
                    optionBase,
                    activeSort === key ? optionActive : optionInactive
                  )}
                >
                  {t("sort." + key)}
                </button>
              ))}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>

      {hasAnyFilter && (
        <button
          type="button"
          onClick={onClear}
          aria-label={t("clear")}
          className="inline-flex items-center gap-1 px-2 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors cursor-pointer shrink-0"
        >
          <X className="size-4" />
          <span className="hidden md:inline">{t("clear")}</span>
        </button>
      )}
    </div>
  );
}
