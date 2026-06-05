import type { Request, Response } from "express";
import { afterEach, describe, expect, it, vi } from "vitest";
import { updateRates } from "./currency.controller.js";

const mocks = vi.hoisted(() => {
  const prisma = {
    exchangeRate: {
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return {
    prisma,
    upsert: prisma.exchangeRate.upsert,
    $transaction: prisma.$transaction,
  };
});

vi.mock("@repo/db", async () => {
  const actual = await vi.importActual<typeof import("@repo/db")>("@repo/db");
  return {
    ...actual,
    prisma: mocks.prisma,
  };
});

const invalidateRateCacheMock = vi.hoisted(() => vi.fn());
vi.mock("../lib/currency.js", () => ({
  invalidateRateCache: invalidateRateCacheMock,
}));

const createResponse = () => {
  const res = {
    json: vi.fn(),
    status: vi.fn(),
  } as unknown as Response & {
    json: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };
  res.status.mockReturnValue(res);
  return res;
};

const buildReq = (body: unknown): Request =>
  ({
    body,
    userId: "user-1",
  }) as unknown as Request;

describe("updateRates", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it("rejects payloads where rates is not an array", async () => {
    const res = createResponse();
    await updateRates(buildReq({ rates: "nope" }), res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "rates must be an array",
    });
    expect(mocks.$transaction).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("rejects entries with currencies outside the Currency enum (and never writes)", async () => {
    const res = createResponse();
    await updateRates(
      buildReq({
        rates: [
          { fromCurrency: "USD", toCurrency: "EUR", rate: 0.92 },
          { fromCurrency: "USD", toCurrency: "EUR", rate: 0.91 },
          { fromCurrency: "USD", toCurrency: "EUR", rate: 0.93 },
          { fromCurrency: "USD", toCurrency: "XYZ", rate: 1.0 },
        ],
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Unsupported currency in entry: USD → XYZ",
    });
    expect(mocks.$transaction).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(invalidateRateCacheMock).not.toHaveBeenCalled();
  });

  it("rejects malformed rate values without writing", async () => {
    const res = createResponse();
    await updateRates(
      buildReq({
        rates: [
          { fromCurrency: "USD", toCurrency: "EUR", rate: 0.92 },
          { fromCurrency: "USD", toCurrency: "MDL", rate: -3 },
        ],
      }),
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.$transaction).not.toHaveBeenCalled();
  });

  it("upserts every entry inside a single $transaction and invalidates cache on success", async () => {
    const expectedResults = [{ id: "a" }, { id: "b" }];
    mocks.$transaction.mockResolvedValue(expectedResults);

    const res = createResponse();
    await updateRates(
      buildReq({
        rates: [
          { fromCurrency: "USD", toCurrency: "EUR", rate: 0.92 },
          { fromCurrency: "USD", toCurrency: "MDL", rate: 17.4 },
        ],
      }),
      res
    );

    expect(mocks.upsert).toHaveBeenCalledTimes(2);
    expect(mocks.$transaction).toHaveBeenCalledTimes(1);
    expect(mocks.$transaction).toHaveBeenCalledWith(expect.any(Array));
    expect(invalidateRateCacheMock).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expectedResults);
  });

  it("does not invalidate the cache when the transaction rejects", async () => {
    mocks.$transaction.mockRejectedValue(new Error("db down"));

    const res = createResponse();
    await expect(
      updateRates(
        buildReq({
          rates: [{ fromCurrency: "USD", toCurrency: "EUR", rate: 0.92 }],
        }),
        res
      )
    ).rejects.toThrow("db down");

    expect(invalidateRateCacheMock).not.toHaveBeenCalled();
  });
});
