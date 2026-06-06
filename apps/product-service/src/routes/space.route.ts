import { Router } from "express";
import {
  createSpace,
  deleteSpace,
  getSpace,
  getSpaces,
  updateSpace,
  getMySpaces,
  getAvailability,
  updateAvailability,
  checkAvailability,
} from "../controllers/space.controller.js";
import {
  getSpaceReviews,
  createReview,
  updateReview,
  deleteReview,
  respondToReview,
} from "../controllers/review.controller.js";
import { shouldBeUser, shouldBeHost, shouldBeHostOrAdmin, resolveActingHost } from "../middleware/authMiddleware.js";

const router: Router = Router();

// Public routes
router.get("/", getSpaces);
router.get("/host/my", shouldBeHost, resolveActingHost, getMySpaces);
router.get("/:id", getSpace);
router.get("/:id/availability", getAvailability);
router.get("/:id/reviews", getSpaceReviews);

// Protected routes (authenticated users)
router.post("/:id/check", shouldBeUser, checkAvailability);
router.post("/:id/reviews", shouldBeUser, createReview);
router.put("/reviews/:reviewId", shouldBeUser, updateReview);
router.delete("/reviews/:reviewId", shouldBeUser, deleteReview);

// Host routes (space management)
router.post("/", shouldBeHost, resolveActingHost, createSpace);
router.put("/:id", shouldBeHostOrAdmin, resolveActingHost, updateSpace);
router.delete("/:id", shouldBeHost, resolveActingHost, deleteSpace);
router.put("/:id/availability", shouldBeHost, resolveActingHost, updateAvailability);
router.post("/reviews/:reviewId/respond", shouldBeHost, resolveActingHost, respondToReview);

export default router;
