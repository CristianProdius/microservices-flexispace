import { Request, Response } from "express";
import { Currency, prisma } from "@repo/db";
import { invalidateRateCache } from "../lib/currency.js";

// PRODSVC-012: cap exchange-rate list at the DB layer to bound payload size.
const EXCHANGE_RATE_HARD_CAP = 1000;

const VALID_CURRENCIES = new Set<string>(Object.values(Currency));

export const getRates = async (_req: Request, res: Response) => {
  const rates = await prisma.exchangeRate.findMany({
    orderBy: [{ fromCurrency: "asc" }, { toCurrency: "asc" }],
    take: EXCHANGE_RATE_HARD_CAP,
  });
  // rate is Prisma.Decimal — serialise as a plain number so existing
  // consumers (admin UI, mobile clients) keep their `typeof rate === "number"` contract.
  res.status(200).json(rates.map((row) => ({ ...row, rate: Number(row.rate) })));
};

export const updateRates = async (req: Request, res: Response) => {
  const userId = req.userId!;
  const { rates } = req.body;

  if (!Array.isArray(rates)) {
    return res.status(400).json({ message: "rates must be an array" });
  }

  // Validate everything up front so we never write a partial set.
  for (const entry of rates) {
    const { fromCurrency, toCurrency, rate } = entry ?? {};
    if (!fromCurrency || !toCurrency || typeof rate !== "number" || rate <= 0) {
      return res.status(400).json({
        message: `Invalid rate entry: ${fromCurrency} → ${toCurrency} = ${rate}`,
      });
    }
    if (!VALID_CURRENCIES.has(fromCurrency) || !VALID_CURRENCIES.has(toCurrency)) {
      return res.status(400).json({
        message: `Unsupported currency in entry: ${fromCurrency} → ${toCurrency}`,
      });
    }
  }

  const operations = rates.map(({ fromCurrency, toCurrency, rate }) =>
    prisma.exchangeRate.upsert({
      where: { fromCurrency_toCurrency: { fromCurrency, toCurrency } },
      update: { rate, updatedBy: userId },
      create: { fromCurrency, toCurrency, rate, updatedBy: userId },
    })
  );

  const results = await prisma.$transaction(operations);

  invalidateRateCache();
  res
    .status(200)
    .json(results.map((row) => ({ ...row, rate: Number(row.rate) })));
};
