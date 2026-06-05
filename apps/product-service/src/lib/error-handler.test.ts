import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { buildErrorHandler } from "./error-handler.js";

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

const noopReq = {} as Request;
const noopNext = (() => {}) as NextFunction;
const silentLogger = { error: vi.fn() };

describe("buildErrorHandler", () => {
  it("maps Prisma P2025 to a generic 404", () => {
    const res = createResponse();
    buildErrorHandler({ logger: silentLogger })(
      {
        code: "P2025",
        message: "Record to delete does not exist. Table `Space` ...",
      },
      noopReq,
      res,
      noopNext
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Resource not found" });
  });

  it("maps Prisma P2002 to a generic 409", () => {
    const res = createResponse();
    buildErrorHandler({ logger: silentLogger })(
      { code: "P2002", message: "Unique constraint failed on `User.email`" },
      noopReq,
      res,
      noopNext
    );
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      message: "Resource already exists",
    });
  });

  it("maps Prisma P2003 to a generic 400", () => {
    const res = createResponse();
    buildErrorHandler({ logger: silentLogger })(
      { code: "P2003", message: "Foreign key constraint failed on field `venueId`" },
      noopReq,
      res,
      noopNext
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Invalid foreign key reference",
    });
  });

  it("passes through authored 4xx messages", () => {
    const res = createResponse();
    buildErrorHandler({ logger: silentLogger })(
      { status: 422, message: "Field `rate` must be positive" },
      noopReq,
      res,
      noopNext
    );
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({
      message: "Field `rate` must be positive",
    });
  });

  it("never leaks the original message on a 5xx", () => {
    const logger = { error: vi.fn() };
    const res = createResponse();
    const original = new Error(
      "PrismaClientKnownRequestError: column `Space.host_id` does not exist"
    );
    buildErrorHandler({ logger })(original, noopReq, res, noopNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error" });
    expect(logger.error).toHaveBeenCalledWith("[product-service]", original);
  });

  it("defaults to 500 when no status is provided", () => {
    const res = createResponse();
    buildErrorHandler({ logger: silentLogger })(
      new Error("unexpected"),
      noopReq,
      res,
      noopNext
    );
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Internal Server Error" });
  });

  it("falls back to 'Bad Request' if a 4xx error lacks a message", () => {
    const res = createResponse();
    buildErrorHandler({ logger: silentLogger })(
      { status: 400 },
      noopReq,
      res,
      noopNext
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: "Bad Request" });
  });
});
