import Room from "../models/Room.js";
import Visit from "../models/Visit.js";
import Action from "../models/Action.js";

export const getRoomTimeline = async (req, res) => {
  try {
    const { id } = req.params;

    const room = await Room.findById(id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    const [visits, actions] = await Promise.all([
      Visit.find({ propertyId: room.propertyId })
        .populate("leadId", "name phone gender")
        .populate("salesUserId", "name phone")
        .sort({ scheduledAt: -1 }),

      Action.find({ "payload.roomId": id })
        .populate("userId", "name role")
        .sort({ createdAt: -1 }),
    ]);

    return res.status(200).json({ room, visits, actions });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};