import { Router } from "express";
import {
  getZones,
  getZoneById,
  createZone,
  updateZone,
} from "../controllers/zones.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", verifyToken, getZones);
router.get("/:id", verifyToken, getZoneById);
router.post("/", verifyToken, requireRole("admin"), createZone);
router.patch("/:id", verifyToken, requireRole("admin"), updateZone);

export default router;