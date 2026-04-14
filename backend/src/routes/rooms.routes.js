import { Router } from "express";
import { getRoomTimeline } from "../controllers/rooms.controller.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

router.get("/:id/timeline", verifyToken, getRoomTimeline);

export default router;