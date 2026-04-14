import { Router } from "express";
import { getLeads, updateLead,createLead } from "../controllers/leads.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", verifyToken, requireRole(["admin", "sales"]), getLeads);
router.patch("/:id", verifyToken, requireRole(["admin", "sales"]), updateLead);
router.post("/", verifyToken, requireRole(["admin","sales"]), createLead);

export default router;