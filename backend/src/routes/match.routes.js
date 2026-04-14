import { Router } from "express";
import { matchProperties } from "../controllers/match.controller.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

router.post("/", verifyToken, matchProperties);

export default router;