import { Router } from "express";
import {
  shouldBeHost,
  shouldBeHostOrAdmin,
  shouldBeAdmin,
  resolveActingHost,
} from "../middleware/authMiddleware.js";
import {
  getMyVenues,
  getVenue,
  getVenuesList,
  createVenue,
  updateVenue,
  deleteVenue,
  getVenueCountsByHost,
} from "../controllers/venue.controller.js";

const router: Router = Router();

// Public Browse Venues listing (replaces the customer-facing Browse Hosts
// page). Must be declared before the `/:id` catch-all so `/venues` doesn't
// fall through to it.
router.get("/", getVenuesList);
router.get("/host/my", shouldBeHost, resolveActingHost, getMyVenues);
router.get("/counts-by-host", shouldBeAdmin, getVenueCountsByHost);
router.post("/", shouldBeHost, resolveActingHost, createVenue);
router.get("/:id", getVenue);
router.put("/:id", shouldBeHostOrAdmin, resolveActingHost, updateVenue);
router.delete("/:id", shouldBeHostOrAdmin, resolveActingHost, deleteVenue);

export default router;
