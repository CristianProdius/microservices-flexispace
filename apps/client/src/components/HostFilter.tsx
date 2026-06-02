"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Check, Search, X } from "lucide-react";

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
  const activeSort: SortKey = isSortKey(searchParams.get("sort"))
    ? (searchParams.get("sort") as SortKey)
    : DEFAULT_SORT;
  const activeSearch = searchParams.get("search") ?? "";

  const [searchDraft, setSearchDraft] = useState(activeSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchDraft(activeSearch);
  }, [activeSearch]);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

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

  const hasAnyFilter = Boolean(activeCity || activeVerified || activeSearch || activeSort !== DEFAULT_SORT);

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <label className="relative flex-1 min-w-[200px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted pointer-events-none" />
        <input
          type="search"
          value={searchDraft}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="w-full pl-9 pr-3 py-2 text-sm border border-border rounded-lg bg-white focus:outline-none focus:border-foreground/40"
        />
      </label>

      <select
        value={activeCity}
        onChange={(e) => writeParam("city", e.target.value || null)}
        aria-label={t("allCities")}
        className="px-3 py-2 text-sm border border-border rounded-lg bg-white text-foreground hover:bg-subtle focus:outline-none focus:border-foreground/40 cursor-pointer"
      >
        <option value="">{t("allCities")}</option>
        {availableCities.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => writeParam("verified", activeVerified ? null : "true")}
        aria-pressed={activeVerified}
        className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border transition-colors cursor-pointer ${
          activeVerified
            ? "bg-success/10 border-success/30 text-foreground"
            : "border-border text-muted hover:bg-subtle hover:text-foreground"
        }`}
      >
        <Check className="size-4" />
        {t("verifiedOnly")}
      </button>

      <select
        value={activeSort}
        onChange={(e) => writeParam("sort", e.target.value === DEFAULT_SORT ? null : e.target.value)}
        aria-label={t("sort.label")}
        className="px-3 py-2 text-sm border border-border rounded-lg bg-white text-foreground hover:bg-subtle focus:outline-none focus:border-foreground/40 cursor-pointer"
      >
        {SORT_KEYS.map((key) => (
          <option key={key} value={key}>
            {t("sort." + key)}
          </option>
        ))}
      </select>

      {hasAnyFilter && (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="size-4" />
          {t("clear")}
        </button>
      )}
    </div>
  );
}
