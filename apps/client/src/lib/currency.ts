const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  MDL: "MDL",
  RON: "RON",
};

const CURRENCY_POSITION: Record<string, "prefix" | "suffix"> = {
  USD: "prefix",
  EUR: "prefix",
  MDL: "suffix",
  RON: "suffix",
};

// AUDIT-B5-FRONTEND (LOW-1): accept an optional next-intl `locale` so ro/ru
// users get locale-correct thousands/decimal separators instead of en-US ones.
// Kept last + optional and defaulted to "en-US" so existing call sites are
// non-breaking; callers can now pass useLocale() to localise the number format.
export function formatCurrencyPrice(
  amount: number | null | undefined,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  if (amount == null) return "";
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const position = CURRENCY_POSITION[currency] || "prefix";
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return position === "prefix" ? `${symbol}${formatted}` : `${formatted} ${symbol}`;
}

// AUDIT-B5-FRONTEND (LOW-1): same optional `locale` threading as above.
export function formatCurrencyPriceFull(
  amount: number | null | undefined,
  currency: string = "USD",
  locale: string = "en-US"
): string {
  if (amount == null) return formatCurrencyPrice(0, currency, locale);
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const position = CURRENCY_POSITION[currency] || "prefix";
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return position === "prefix" ? `${symbol}${formatted}` : `${formatted} ${symbol}`;
}
