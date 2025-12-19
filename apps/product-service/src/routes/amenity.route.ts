import { Router } from "express";
import {
  createAmenity,
  deleteAmenity,
  getAmenities,
  getAmenity,
  updateAmenity,
} from "../controllers/amenity.controller.js";
import { shouldBeAdmin } from "../middleware/authMiddleware.js";

const router: Router = Router();

// Public routes
router.get("/", getAmenities);
router.get("/:id", getAmenity);

// Admin routes
router.post("/", shouldBeAdmin, createAmenity);
router.put("/:id", shouldBeAdmin, updateAmenity);
router.delete("/:id", shouldBeAdmin, deleteAmenity);

export default router;
