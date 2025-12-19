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
import { shouldBeUser, shouldBeHost, shouldBeAdmin } from "../middleware/authMiddleware.js";

const router: Router = Router();

// Public routes
router.get("/", getSpaces);
router.get("/:id", getSpace);
router.get("/:id/availability", getAvailability);
router.get("/:id/reviews", getSpaceReviews);

// Host routes (my spaces)
router.get("/host/my", shouldBeHost, getMySpaces);

// Protected routes (authenticated users)
router.post("/:id/check", shouldBeUser, checkAvailability);
router.post("/:id/reviews", shouldBeUser, createReview);
router.put("/reviews/:reviewId", shouldBeUser, updateReview);
router.delete("/reviews/:reviewId", shouldBeUser, deleteReview);

// Host routes (space management)
router.post("/", shouldBeHost, createSpace);
router.put("/:id", shouldBeHost, updateSpace);
router.delete("/:id", shouldBeHost, deleteSpace);
router.put("/:id/availability", shouldBeHost, updateAvailability);
router.post("/reviews/:reviewId/respond", shouldBeHost, respondToReview);

export default router;
