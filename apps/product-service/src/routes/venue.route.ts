import { Router } from "express";
import {
  shouldBeHost,
  shouldBeHostOrAdmin,
  resolveActingHost,
} from "../middleware/authMiddleware.js";
import {
  getMyVenues,
  getVenue,
  createVenue,
  updateVenue,
  deleteVenue,
} from "../controllers/venue.controller.js";

const router: Router = Router();

router.get("/host/my", shouldBeHost, resolveActingHost, getMyVenues);
router.post("/", shouldBeHost, resolveActingHost, createVenue);
router.get("/:id", getVenue);
router.put("/:id", shouldBeHostOrAdmin, resolveActingHost, updateVenue);
router.delete("/:id", shouldBeHostOrAdmin, resolveActingHost, deleteVenue);

export default router;
