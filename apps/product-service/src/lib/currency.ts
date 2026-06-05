import { prisma } from "@repo/db";

interface RateCache {
  rates: Map<string, number>;
  loadedAt: number;
}

let cache: RateCache | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function loadRates(): Promise<Map<string, number>> {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL) {
    return cache.rates;
  }

  const rows = await prisma.exchangeRate.findMany();
  const rates = new Map<string, number>();

  for (const row of rows) {
    // row.rate is Prisma.Decimal; convert to Number for arithmetic.
    rates.set(`${row.fromCurrency}_${row.toCurrency}`, Number(row.rate));
  }

  for (const c of ["USD", "EUR", "MDL"]) {
    rates.set(`${c}_${c}`, 1.0);
  }

  cache = { rates, loadedAt: Date.now() };
  return rates;
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  if (from === to) return amount;
  const rates = await loadRates();
  let rate = rates.get(`${from}_${to}`);
  // Fallback: chain through USD
  if (!rate) {
    const toUsd = rates.get(`${from}_USD`);
    const fromUsd = rates.get(`USD_${to}`);
    if (toUsd && fromUsd) rate = toUsd * fromUsd;
  }
  if (!rate) throw new Error(`No exchange rate for ${from} → ${to}`);
  return Math.round(amount * rate * 100) / 100;
}

export async function getRate(from: string, to: string): Promise<number> {
  if (from === to) return 1.0;
  const rates = await loadRates();
  let rate = rates.get(`${from}_${to}`);
  // Fallback: chain through USD
  if (!rate) {
    const toUsd = rates.get(`${from}_USD`);
    const fromUsd = rates.get(`USD_${to}`);
    if (toUsd && fromUsd) rate = toUsd * fromUsd;
  }
  if (!rate) throw new Error(`No exchange rate for ${from} → ${to}`);
  return rate;
}

export function invalidateRateCache(): void {
  cache = null;
}
