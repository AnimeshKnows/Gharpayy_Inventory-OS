import { Router } from "express";
import {
  getOverview,
  getAdminInventory,
  getUsers,
  createUser,
  updateUser,
  createProperty,
  updateProperty,
  createRoom,
  getPropertyRequests,
  updatePropertyRequest,
  getProperties,
} from "../controllers/admin.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/overview", verifyToken, requireRole("admin"), getOverview);
router.get("/inventory", verifyToken, requireRole("admin"), getAdminInventory);
router.get("/users", verifyToken, requireRole("admin"), getUsers);
router.post("/users", verifyToken, requireRole("admin"), createUser);
router.patch("/users/:id", verifyToken, requireRole("admin"), updateUser);
router.get("/properties", verifyToken, requireRole("admin"), getAdminInventory);
router.post("/properties", verifyToken, requireRole("admin"), createProperty);
router.patch("/properties/:id", verifyToken, requireRole("admin"), updateProperty);
router.post("/rooms", verifyToken, requireRole("admin"), createRoom);
router.get("/property-requests", verifyToken, requireRole("admin"), getPropertyRequests);
router.patch("/property-requests/:id", verifyToken, requireRole("admin"), updatePropertyRequest);
router.get("/properties", verifyToken, getProperties);

export default router;