import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategory,
  updateCategory,
} from "../controllers/category.controller.js";
import { shouldBeAdmin } from "../middleware/authMiddleware.js";

const router: Router = Router();

// Public routes
router.get("/", getCategories);
router.get("/:id", getCategory);

// Admin routes
router.post("/", shouldBeAdmin, createCategory);
router.put("/:id", shouldBeAdmin, updateCategory);
router.delete("/:id", shouldBeAdmin, deleteCategory);

export default router;
