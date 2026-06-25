import { Router } from "express";
import { shouldBeAdmin } from "../middleware/authMiddleware.js";
import {
  getHosts,
  getHost,
  updateHostListingBadges,
} from "../controllers/host.controller.js";

const router: Router = Router();

router.get("/", getHosts);
router.put("/:id/listing-badges", shouldBeAdmin, updateHostListingBadges);
router.get("/:id", getHost);

export default router;
