import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { signAccessToken } from "@repo/auth-middleware/jwt";
import express, { type NextFunction, type Request, type Response } from "express";
import { IncomingMessage, ServerResponse } from "node:http";
import { Duplex, Readable } from "node:stream";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// AUD-005/021: `shouldBe*` now consults `lookupActiveUser` which queries
// `prisma.user.findFirst`. The upload route uses the real auth-middleware
// (not a local re-export), so we have to stub @repo/db here even though
// nothing else in this file touches Prisma.
vi.mock("@repo/db", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve({ id: where.id, role: "HOST" }),
      ),
    },
  },
}));

import uploadRouter from "./upload.route.js";
import * as uploadUtils from "../utils/upload.js";

const ONE_BY_ONE_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jhfoAAAAASUVORK5CYII=",
  "base64"
);
const SVG_IMAGE = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1"/></svg>'
);

class MockSocket extends Duplex {
  public destroyed = false;
  public remoteAddress = "127.0.0.1";
  public writable = true;
  public _writableState = {
    corked: 0,
  };

  _read() {}

  _write(
    _chunk: Buffer | string,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void
  ) {
    callback();
  }

  destroy(error?: Error) {
    this.destroyed = true;
    if (error) {
      this.emit("error", error);
    }
    this.emit("close");
    return this;
  }

  setTimeout() {
    return this;
  }

  cork() {}

  uncork() {}

  end() {
    this.emit("finish");
    return this;
  }

  destroySoon() {}
}

const createTestApp = () => {
  const app = express();
  app.use("/uploads", uploadRouter);
  app.use(
    (
      err: { status?: number; message?: string },
      _req: Request,
      res: Response,
      _next: NextFunction
    ) => {
      return res
        .status(err.status || 500)
        .json({ message: err.message || "Internal Server Error!" });
    }
  );
  return app;
};

const createToken = (
  role: "USER" | "HOST" | "ADMIN",
  hostVerified = role !== "HOST" ? undefined : true
) =>
  signAccessToken({
    userId: "host-user-1",
    email: "host@example.com",
    role,
    ...(hostVerified !== undefined && { hostVerified }),
  });

const createMultipartBody = (file: {
  body: Buffer;
  contentType: string;
  fieldName?: string;
  filename: string;
}) => {
  const boundary = `----spacefly-${Math.random().toString(16).slice(2)}`;
  const fieldName = file.fieldName ?? "file";
  const body = Buffer.concat([
    Buffer.from(
      `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="${fieldName}"; filename="${file.filename}"\r\n` +
        `Content-Type: ${file.contentType}\r\n\r\n`
    ),
    file.body,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  return {
    body,
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
};

const invokeApp = async (input: {
  authorization?: string;
  body?: Buffer;
  contentType?: string;
  method: string;
  url: string;
}) => {
  const app = createTestApp();
  const socket = new MockSocket();
  const req = new IncomingMessage(socket as never);
  const res = new ServerResponse(req);
  const chunks: Buffer[] = [];
  req.on("end", () => {
    req.complete = true;
  });

  res.write = ((
    chunk: string | Buffer | Uint8Array,
    _encoding?: BufferEncoding,
    callback?: (error?: Error | null) => void
  ) => {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    callback?.();
    return true;
  }) as typeof res.write;

  res.end = ((
    chunk?: string | Buffer | Uint8Array,
    _encoding?: BufferEncoding,
    callback?: () => void
  ) => {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    res.finished = true;
    callback?.();
    res.emit("finish");
    return res;
  }) as typeof res.end;

  req.method = input.method;
  req.url = input.url;
  req.headers = {
    ...(input.authorization ? { authorization: input.authorization } : {}),
    ...(input.contentType ? { "content-type": input.contentType } : {}),
    ...(input.body ? { "content-length": String(input.body.length) } : {}),
  };

  const finished = new Promise<void>((resolve, reject) => {
    res.on("finish", resolve);
    res.on("error", reject);
  });

  app(req as never, res as never);
  if (input.body) {
    req.push(input.body);
  }
  req.push(null);

  await finished;
  socket.destroy();
  res.removeAllListeners();
  req.removeAllListeners();

  const body = Buffer.concat(chunks);
  const responseContentType = res.getHeader("content-type");
  const json =
    typeof responseContentType === "string" &&
    responseContentType.includes("application/json")
      ? JSON.parse(body.toString("utf8"))
      : null;

  return {
    body,
    headers: Object.fromEntries(
      Object.entries(res.getHeaders()).map(([key, value]) => [
        key,
        Array.isArray(value) ? value.join(", ") : String(value),
      ])
    ),
    json,
    status: res.statusCode,
  };
};

describe("upload routes", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test-jwt-secret";
    process.env.S3_ENDPOINT = "http://minio.test";
    process.env.S3_REGION = "us-east-1";
    process.env.S3_ACCESS_KEY_ID = "access-key";
    process.env.S3_SECRET_ACCESS_KEY = "secret-key";
    process.env.S3_BUCKET = "spacefly-test";
    process.env.S3_PUBLIC_BASE_URL = "https://api.spacefly.ai/uploads";
  });

  beforeEach(async () => {
    // Clear the module-level userCache between tests so the active-user
    // lookup is exercised fresh each time (AUD-021).
    const { _clearUserCacheForTests } = await import("@repo/auth-middleware");
    _clearUserCacheForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects unauthenticated uploads", async () => {
    const upload = createMultipartBody({
      body: ONE_BY_ONE_PNG,
      contentType: "image/png",
      filename: "space.png",
    });

    const response = await invokeApp({
      body: upload.body,
      contentType: upload.contentType,
      method: "POST",
      url: "/uploads/images",
    });

    expect(response.status).toBe(401);
    expect(response.json).toEqual({ message: "No token provided" });
  });

  it("rejects non-host uploads", async () => {
    const upload = createMultipartBody({
      body: ONE_BY_ONE_PNG,
      contentType: "image/png",
      filename: "space.png",
    });

    const response = await invokeApp({
      authorization: `Bearer ${createToken("USER")}`,
      body: upload.body,
      contentType: upload.contentType,
      method: "POST",
      url: "/uploads/images",
    });

    expect(response.status).toBe(403);
    expect(response.json).toEqual({ message: "Verified host or Admin access required" });
  });

  it("rejects requests without a file", async () => {
    const response = await invokeApp({
      authorization: `Bearer ${createToken("HOST")}`,
      method: "POST",
      url: "/uploads/images",
    });

    expect(response.status).toBe(400);
    expect(response.json).toEqual({ message: "Image file is required" });
  });

  it("rejects files whose bytes do not match a supported image type", async () => {
    const send = vi.fn();
    const upload = createMultipartBody({
      body: Buffer.from("not really an image"),
      contentType: "image/png",
      filename: "space.png",
    });

    vi.spyOn(uploadUtils, "getS3Client").mockReturnValue({
      send,
    } as unknown as ReturnType<typeof uploadUtils.getS3Client>);

    const response = await invokeApp({
      authorization: `Bearer ${createToken("HOST")}`,
      body: upload.body,
      contentType: upload.contentType,
      method: "POST",
      url: "/uploads/images",
    });

    expect(response.status).toBe(400);
    expect(response.json).toEqual({
      message: "Only supported raster image uploads are allowed",
    });
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects svg uploads", async () => {
    const send = vi.fn();
    const upload = createMultipartBody({
      body: SVG_IMAGE,
      contentType: "image/svg+xml",
      filename: "space.svg",
    });

    vi.spyOn(uploadUtils, "getS3Client").mockReturnValue({
      send,
    } as unknown as ReturnType<typeof uploadUtils.getS3Client>);

    const response = await invokeApp({
      authorization: `Bearer ${createToken("HOST")}`,
      body: upload.body,
      contentType: upload.contentType,
      method: "POST",
      url: "/uploads/images",
    });

    expect(response.status).toBe(400);
    expect(response.json).toEqual({ message: "SVG uploads are not allowed" });
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects oversized uploads", async () => {
    const upload = createMultipartBody({
      body: Buffer.alloc(10 * 1024 * 1024 + 1, 0),
      contentType: "image/png",
      filename: "space.png",
    });

    const response = await invokeApp({
      authorization: `Bearer ${createToken("HOST")}`,
      body: upload.body,
      contentType: upload.contentType,
      method: "POST",
      url: "/uploads/images",
    });

    expect(response.status).toBe(413);
    expect(response.json).toEqual({ message: "Image must be 10MB or smaller" });
  });

  it("uploads a validated image and returns a proxied uploads url", async () => {
    const send = vi.fn().mockResolvedValue({});
    const upload = createMultipartBody({
      body: ONE_BY_ONE_PNG,
      contentType: "image/png",
      filename: "space.txt",
    });

    vi.spyOn(uploadUtils, "getS3Client").mockReturnValue({
      send,
    } as unknown as ReturnType<typeof uploadUtils.getS3Client>);

    const response = await invokeApp({
      authorization: `Bearer ${createToken("HOST")}`,
      body: upload.body,
      contentType: upload.contentType,
      method: "POST",
      url: "/uploads/images",
    });

    expect(response.status).toBe(201);
    expect(response.json?.url).toMatch(
      /^https:\/\/api\.spacefly\.ai\/uploads\/spaces\/host-user-1\/.+\.png$/
    );
    expect(send).toHaveBeenCalledTimes(1);

    const [command] = send.mock.calls[0] as [PutObjectCommand];
    expect(command).toBeInstanceOf(PutObjectCommand);
    expect(command.input.Bucket).toBe("spacefly-test");
    expect(command.input.ContentType).toBe("image/png");
    expect(command.input.Key).toMatch(/^spaces\/host-user-1\/.+\.png$/);
    expect(command.input.Key).not.toMatch(/\.txt$/);
  });

  it("allows admins to upload validated images", async () => {
    const send = vi.fn().mockResolvedValue({});
    const upload = createMultipartBody({
      body: ONE_BY_ONE_PNG,
      contentType: "image/png",
      filename: "space.png",
    });

    vi.spyOn(uploadUtils, "getS3Client").mockReturnValue({
      send,
    } as unknown as ReturnType<typeof uploadUtils.getS3Client>);

    const response = await invokeApp({
      authorization: `Bearer ${createToken("ADMIN")}`,
      body: upload.body,
      contentType: upload.contentType,
      method: "POST",
      url: "/uploads/images",
    });

    expect(response.status).toBe(201);
    expect(response.json?.url).toMatch(
      /^https:\/\/api\.spacefly\.ai\/uploads\/spaces\/host-user-1\/.+\.png$/
    );
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("streams uploaded images with safe content headers", async () => {
    const send = vi.fn().mockResolvedValue({
      Body: Readable.from(ONE_BY_ONE_PNG),
      CacheControl: "public, max-age=60",
      ContentLength: ONE_BY_ONE_PNG.length,
      ContentType: "image/png",
      ETag: '"etag-1"',
      LastModified: new Date("2026-04-23T10:00:00.000Z"),
    });

    vi.spyOn(uploadUtils, "getS3Client").mockReturnValue({
      send,
    } as unknown as ReturnType<typeof uploadUtils.getS3Client>);

    const response = await invokeApp({
      method: "GET",
      url: "/uploads/spaces/host-user-1/example.png",
    });

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("image/png");
    expect(response.headers["cache-control"]).toBe("public, max-age=60");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(Buffer.compare(response.body, ONE_BY_ONE_PNG)).toBe(0);

    const [command] = send.mock.calls[0] as [GetObjectCommand];
    expect(command).toBeInstanceOf(GetObjectCommand);
    expect(command.input.Key).toBe("spaces/host-user-1/example.png");
  });

  it("returns not found for keys outside the public allow-list (PRODSVC-003)", async () => {
    const send = vi.fn().mockResolvedValue({
      Body: Readable.from(ONE_BY_ONE_PNG),
      ContentType: "image/png",
    });

    vi.spyOn(uploadUtils, "getS3Client").mockReturnValue({
      send,
    } as unknown as ReturnType<typeof uploadUtils.getS3Client>);

    const response = await invokeApp({
      method: "GET",
      url: "/uploads/backups/db-dump.sql",
    });

    expect(response.status).toBe(404);
    expect(response.json).toEqual({ message: "Upload not found" });
    // The guard must short-circuit before any S3 request fires.
    expect(send).not.toHaveBeenCalled();
  });

  it("rejects traversal attempts even under an allowed prefix (PRODSVC-003)", async () => {
    const send = vi.fn().mockResolvedValue({
      Body: Readable.from(ONE_BY_ONE_PNG),
      ContentType: "image/png",
    });

    vi.spyOn(uploadUtils, "getS3Client").mockReturnValue({
      send,
    } as unknown as ReturnType<typeof uploadUtils.getS3Client>);

    const response = await invokeApp({
      method: "GET",
      url: "/uploads/spaces/../backups/db-dump.sql",
    });

    expect(response.status).toBe(404);
    expect(send).not.toHaveBeenCalled();
  });

  it("returns not found when the proxied upload is missing", async () => {
    const error = Object.assign(new Error("missing"), {
      name: "NoSuchKey",
      $metadata: { httpStatusCode: 404 },
    });

    vi.spyOn(uploadUtils, "getS3Client").mockReturnValue({
      send: vi.fn().mockRejectedValue(error),
    } as unknown as ReturnType<typeof uploadUtils.getS3Client>);

    const response = await invokeApp({
      method: "GET",
      url: "/uploads/spaces/host-user-1/missing.png",
    });

    expect(response.status).toBe(404);
    expect(response.json).toEqual({ message: "Upload not found" });
  });
});
