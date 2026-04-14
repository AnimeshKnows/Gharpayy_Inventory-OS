import { Router } from "express";
import {
  getSalesInventory,
  getUpcomingVisits,
  createVisit,
  updateVisit,
  logActionController as logAction,
  approveRetail,
  lockRoom,
  unlockRoom,
} from "../controllers/sales.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/inventory", verifyToken, requireRole(["sales","admin"]), getSalesInventory);
router.get("/visits/upcoming", verifyToken, requireRole(["sales","admin"]), getUpcomingVisits);
router.post("/visits", verifyToken, requireRole(["sales","admin"]), createVisit);
router.patch("/visits/:id", verifyToken, requireRole(["sales","admin"]), updateVisit);
router.post("/actions", verifyToken, requireRole(["sales","admin"]), logAction);
router.post("/retail/approve", verifyToken, requireRole(["sales","admin"]), approveRetail);
router.post("/retail/lock", verifyToken, requireRole(["sales","admin"]), lockRoom);
router.post("/retail/unlock", verifyToken, requireRole(["sales","admin"]), unlockRoom);

export default router;