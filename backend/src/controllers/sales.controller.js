import Property from "../models/Property.js";
import Room from "../models/Room.js";
import Visit from "../models/Visit.js";
import Action from "../models/Action.js";
import Lead from "../models/Lead.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const logAction = async (userId, type, payload = {}) => {
  await Action.create({ userId, type, payload });
};

// ─── Controllers ──────────────────────────────────────────────────────────────

export const getSalesInventory = async (req, res) => {
  try {
    const { gender, propertyType, roomType } = req.query;

    if (!req.user.area) {
      return res.status(400).json({
        message: "No area assigned to user"
      });
    }

    const filter = { area: req.user.area };
    if (gender) filter.gender = gender;
    if (propertyType) filter.propertyType = propertyType;

    const properties = await Property.find(filter).lean();

    const results = [];

    for (const property of properties) {
      const roomFilter = { propertyId: property._id };
      if (roomType) roomFilter.roomType = roomType;

      const rooms = await Room.find(roomFilter).lean();
      if (rooms.length === 0) continue;

      results.push({ ...property, rooms });
    }

    return res.status(200).json(results);

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
export const getUpcomingVisits = async (req, res) => {
  try {
    const results = await Visit.find({
      salesUserId: req.user._id,
      status: "scheduled",
      scheduledAt: { $gte: new Date() },
    })
      .populate("leadId", "name phone gender")
      .populate("propertyId", "name area locality")
      .sort({ scheduledAt: 1 });

    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const createVisit = async (req, res) => {
  try {
    const { leadId, propertyId, scheduledAt, notes } = req.body;

    if (!leadId || !propertyId || !scheduledAt) {
      return res.status(400).json({ message: "leadId, propertyId and scheduledAt are required" });
    }

    const [lead, property] = await Promise.all([
      Lead.findById(leadId),
      Property.findById(propertyId),
    ]);

    if (!lead) return res.status(404).json({ message: "Lead not found" });
    if (!property) return res.status(404).json({ message: "Property not found" });

    const visit = await Visit.create({
      leadId,
      propertyId,
      scheduledAt,
      notes,
      salesUserId: req.user._id,
      status: "scheduled"
    });

    await logAction(req.user._id, "VISIT_SCHEDULED", { leadId, propertyId, scheduledAt });

    return res.status(201).json(visit);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateVisit = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, scheduledAt } = req.body;

    const existing = await Visit.findOne({ _id: id, salesUserId: req.user._id });
    if (!existing) return res.status(404).json({ message: "Visit not found" });

    const update = {};
    if (status !== undefined) update.status = status;
    if (notes !== undefined) update.notes = notes;
    if (scheduledAt !== undefined) update.scheduledAt = scheduledAt;

    const visit = await Visit.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json(visit);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const logActionController = async (req, res) => {
  try {
    const { type, payload } = req.body;

    if (!type) return res.status(400).json({ message: "Action type is required" });

    const action = await Action.create({ userId: req.user._id, type, payload });

    return res.status(201).json(action);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const lockRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId) return res.status(400).json({ message: "Room ID is required" });

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (room.retail.retailStatus !== "open") {
      return res.status(400).json({ message: "Room is not available for locking" });
    }

    room.retail.retailStatus = "locked";
    await room.save();
    await logAction(req.user._id, "ROOM_LOCKED", { roomId });

    return res.status(200).json(room);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const unlockRoom = async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId) return res.status(400).json({ message: "Room ID is required" });

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (room.retail.retailStatus !== "locked") {
      return res.status(400).json({ message: "Room is not locked" });
    }

    room.retail.retailStatus = "open";
    await room.save();
    await logAction(req.user._id, "ROOM_UNLOCKED", { roomId });

    return res.status(200).json(room);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const approveRetail = async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!roomId) return res.status(400).json({ message: "Room ID is required" });

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    if (room.retail.retailStatus !== "locked") {
      return res.status(400).json({ message: "Room must be locked before approval" });
    }

    room.retail.retailStatus = "approved";
    await room.save();
    await logAction(req.user._id, "ROOM_APPROVED", { roomId });

    return res.status(200).json(room);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};