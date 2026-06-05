import { Request, Response } from "express";
import { Currency, prisma } from "@repo/db";
import { invalidateRateCache } from "../lib/currency.js";

const VALID_CURRENCIES = new Set<string>(Object.values(Currency));

export const getRates = async (_req: Request, res: Response) => {
  const rates = await prisma.exchangeRate.findMany({
    orderBy: [{ fromCurrency: "asc" }, { toCurrency: "asc" }],
  });
  res.status(200).json(rates);
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
  res.status(200).json(results);
};
