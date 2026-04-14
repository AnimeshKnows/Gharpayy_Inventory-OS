import Property from "../models/Property.js";
import Room from "../models/Room.js";
import Action from "../models/Action.js";

export const getOwnerProperties = async (req, res) => {
  try {
    const results = await Property.find({ ownerCode: req.user.ownerCode })
      .sort({ createdAt: -1 });

    return res.status(200).json({ count: results.length, results });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getOwnerPropertyRooms = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      ownerCode: req.user.ownerCode,
    });

    if (!property) return res.status(404).json({ message: "Property not found" });

    const rooms = await Room.find({ propertyId: property._id }).sort({ roomType: 1 });

    return res.status(200).json({ property, rooms });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateAvailability = async (req, res) => {
  try {
    const { roomId, availabilityType, availableDate } = req.body;

    if (!roomId)           return res.status(400).json({ message: "Room ID is required" });
    if (!availabilityType) return res.status(400).json({ message: "Availability type is required" });

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: "Room not found" });

    const property = await Property.findOne({
      _id: room.propertyId,
      ownerCode: req.user.ownerCode,
    });

    if (!property) return res.status(403).json({ message: "Not authorized" });

    room.availability.availabilityType = availabilityType;
    room.availability.availableDate =
      availabilityType === "from date" ? availableDate ?? null : null;

    await room.save();

    return res.status(200).json(room);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getOwnerEffort = async (req, res) => {
  try {
    const property = await Property.findOne({
      _id: req.params.id,
      ownerCode: req.user.ownerCode,
    });

    if (!property) return res.status(404).json({ message: "Property not found" });

    const actions = await Action.find({ "payload.propertyId": req.params.id })
      .populate("userId", "name role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      property: { name: property.name, area: property.area },
      actions,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};