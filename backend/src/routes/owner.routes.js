import { Router } from "express";
import {
  getOwnerProperties,
  getOwnerPropertyRooms,
  updateAvailability,
  getOwnerEffort,
} from "../controllers/owner.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/properties", verifyToken, requireRole("owner"), getOwnerProperties);
router.get("/properties/:id/rooms", verifyToken, requireRole("owner"), getOwnerPropertyRooms);
router.post("/availability", verifyToken, requireRole("owner"), updateAvailability);
router.get("/effort/:id", verifyToken, requireRole("owner"), getOwnerEffort);

export default router;