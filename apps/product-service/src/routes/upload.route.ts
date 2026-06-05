import { Router, type RequestHandler, type Request, type Response, type NextFunction } from "express";
import multer, { type FileFilterCallback } from "multer";
import { shouldBeHostOrAdmin } from "../middleware/authMiddleware.js";
import { streamUploadedImage, uploadImage } from "../controllers/upload.controller.js";
import { createHttpError } from "../utils/upload.js";

/**
 * Allow-list of S3 key prefixes that the unauthenticated `GET /uploads/*`
 * proxy is permitted to stream from the bucket.
 *
 * The bucket is shared by this service and may hold other artifacts
 * (backups, exports, internal files for other services). Without this
 * gate, anyone could enumerate or read arbitrary keys (PRODSVC-003).
 *
 * Current writers (see `buildSpaceImageObjectKey` in `utils/upload.ts`)
 * place public space/venue images under `spaces/<userId>/...`. Extend
 * this list when new public asset roots are introduced; never include
 * prefixes that hold private or backend-only data.
 *
 * Requests that miss the allow-list intentionally return 404 (not 403)
 * to avoid leaking the existence of out-of-scope keys.
 */
const PUBLIC_UPLOAD_PREFIXES = ["spaces/"] as const;

const isPubliclyServableKey = (key: string): boolean => {
  if (!key) return false;
  // Reject parent-directory traversal / absolute paths defensively even
  // though `getObjectKeyFromRoute` already strips leading slashes.
  if (key.includes("..") || key.startsWith("/")) return false;
  return PUBLIC_UPLOAD_PREFIXES.some((prefix) => key.startsWith(prefix));
};

const guardPublicUploadPrefix: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const rawKey = req.params[0];
  const key = typeof rawKey === "string" ? rawKey.replace(/^\/+/, "") : "";
  if (!isPubliclyServableKey(key)) {
    next(createHttpError(404, "Upload not found"));
    return;
  }
  next();
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, callback: FileFilterCallback) => {
    if (!file.mimetype.startsWith("image/")) {
      callback(createHttpError(400, "Only image uploads are allowed"));
      return;
    }

    callback(null, true);
  },
});

const handleSingleImageUpload: RequestHandler = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        next(createHttpError(413, "Image must be 10MB or smaller"));
        return;
      }

      next(createHttpError(400, error.message));
      return;
    }

    next(error);
  });
};

const router: Router = Router();

router.post("/images", shouldBeHostOrAdmin, handleSingleImageUpload, uploadImage);
router.get(/^\/(.+)$/, guardPublicUploadPrefix, streamUploadedImage);

export default router;
