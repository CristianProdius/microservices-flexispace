export type Currency = "USD" | "EUR" | "MDL";

export interface ExchangeRate {
  id: number;
  fromCurrency: Currency;
  toCurrency: Currency;
  rate: number;
  updatedAt: string;
  updatedBy: string | null;
}

export interface PricingTier {
  id: number;
  spaceId: number;
  minutes: number;
  label: string;
  price: number;
  comment?: string;
}

export const CURRENCIES: readonly Currency[] = ["USD", "EUR", "MDL"] as const;

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  MDL: "L",
};

export const CURRENCY_LABELS: Record<Currency, string> = {
  USD: "US Dollar (USD)",
  EUR: "Euro (EUR)",
  MDL: "Moldovan Leu (MDL)",
};

export const PRICING_TIER_PRESETS = [
  { minutes: 60, label: "1 hour" },
  { minutes: 120, label: "2 hours" },
  { minutes: 180, label: "3 hours" },
  { minutes: 240, label: "4 hours (half day)" },
  { minutes: 480, label: "8 hours (full day)" },
  { minutes: 1440, label: "1 day" },
  { minutes: 2880, label: "2 days" },
  { minutes: 4320, label: "3 days" },
  { minutes: 10080, label: "1 week" },
  { minutes: 20160, label: "2 weeks" },
  { minutes: 43200, label: "1 month" },
] as const;
