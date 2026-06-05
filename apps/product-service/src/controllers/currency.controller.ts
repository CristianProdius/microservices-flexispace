import { Request, Response } from "express";
import { prisma } from "@repo/db";
import { invalidateRateCache } from "../lib/currency.js";

// PRODSVC-012: cap exchange-rate list at the DB layer to bound payload size.
const EXCHANGE_RATE_HARD_CAP = 1000;

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

  const results = [];
  for (const { fromCurrency, toCurrency, rate } of rates) {
    if (!fromCurrency || !toCurrency || typeof rate !== "number" || rate <= 0) {
      return res.status(400).json({
        message: `Invalid rate entry: ${fromCurrency} → ${toCurrency} = ${rate}`,
      });
    }
    const updated = await prisma.exchangeRate.upsert({
      where: { fromCurrency_toCurrency: { fromCurrency, toCurrency } },
      update: { rate, updatedBy: userId },
      create: { fromCurrency, toCurrency, rate, updatedBy: userId },
    });
    results.push(updated);
  }

  invalidateRateCache();
  res
    .status(200)
    .json(results.map((row) => ({ ...row, rate: Number(row.rate) })));
};
