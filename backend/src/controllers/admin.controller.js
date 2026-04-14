import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Property from "../models/Property.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import Lead from "../models/Lead.js";
import Visit from "../models/Visit.js";
import Action from "../models/Action.js";

// ─── Inline PropertyRequest model ─────────────────────────────────────────────

const propertyRequestSchema = new mongoose.Schema(
  {
    ownerCode: String,
    data: mongoose.Schema.Types.Mixed,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

const PropertyRequest =
  mongoose.models.PropertyRequest ||
  mongoose.model("PropertyRequest", propertyRequestSchema);

// ─── Controllers ──────────────────────────────────────────────────────────────

export const getOverview = async (req, res) => {
  try {
    const [
      properties,
      rooms,
      locked,
      approved,
      immediate,
      leads,
      visits,
      team,
      partners
    ] = await Promise.all([
      Property.countDocuments(),
      Room.countDocuments(),

      Room.countDocuments({ "retail.retailStatus": "locked" }),
      Room.countDocuments({ "retail.retailStatus": "approved" }),
      Room.countDocuments({ "availability.availabilityType": "immediate" }),

      Lead.countDocuments(),
      Visit.countDocuments(),

      User.countDocuments({ role: "sales" }),
      User.countDocuments({ role: "partner" })
    ]);

    return res.status(200).json({
      overview: {
        properties,
        rooms,
        locked,
        approved,
        immediate,
        leads,
        visits,
        team,
        partners
      }
    });

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
export const getAdminInventory = async (req, res) => {
  try {
    const { area, gender, propertyType, priority, zoneId, page = 1, limit = 20 } = req.query;

    const match = {};
    if (area) match.area = area;
    if (gender) match.gender = gender;
    if (propertyType) match.propertyType = propertyType;
    if (priority) match.priority = priority;
    if (zoneId) match.zoneId = new mongoose.Types.ObjectId(zoneId);

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 20);
    const skip = (pageNum - 1) * limitNum;

    const properties = await Property.aggregate([
      { $match: match },
      {
        $addFields: {
          _priorityWeight: {
            $switch: {
              branches: [
                { case: { $eq: ["$priority", "super urgent"] }, then: 3 },
                { case: { $eq: ["$priority", "push"] }, then: 2 },
                { case: { $eq: ["$priority", "normal"] }, then: 1 },
              ],
              default: 0,
            },
          },
        },
      },
      { $sort: { _priorityWeight: -1, createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum },
      { $unset: "_priorityWeight" },
    ]);

    const totalCount = await Property.countDocuments(match);

    const results = [];
    for (const property of properties) {
      const rooms = await Room.find({ propertyId: property._id }).lean();
      results.push({ ...property, rooms });
    }

    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;

    const results = await User.find(filter).select("-password").sort({ createdAt: -1 });

    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, phone, password, role, area, ownerCode } = req.body;

    if (!name || !phone || !password || !role) {
      return res.status(400).json({ message: "Name, phone, password and role are required" });
    }

    const existing = await User.findOne({ phone });
    if (existing) return res.status(409).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ name, phone, password: hashedPassword, role, area, ownerCode });

    await Action.create({
      userId: req.user._id,
      type: "USER_CREATED",
      payload: { createdUserId: user._id, role },
    });

    const { password: _pw, ...userOut } = user.toObject();
    return res.status(201).json(userOut);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, area, role, ownerCode } = req.body;

    const update = {};
    if (name !== undefined) update.name = name;
    if (area !== undefined) update.area = area;
    if (role !== undefined) update.role = role;
    if (ownerCode !== undefined) update.ownerCode = ownerCode;

    const user = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const createProperty = async (req, res) => {
  try {
    // clone body
    const body = { ...req.body };

    // remove empty strings
    Object.keys(body).forEach((k) => {
      if (body[k] === "") delete body[k];
    });

    // normalize required fields
    const name = body.name || body.propertyName || body.property;
    const area = body.area || body.zone || body.location;
    const gender = body.gender || "unisex";

    if (!name || !area) {
      return res.status(400).json({ message: "Name and area required" });
    }

    body.name = name;
    body.area = area;
    body.gender = gender;

    const existing = await Property.findOne({ name, area });
    if (existing) {
      return res.status(409).json({ message: "Property already exists" });
    }
    body.createdBy = req.user._id;
    body.createdByRole = req.user.role;
    const property = await Property.create(body);

    await Action.create({
      userId: req.user._id,
      type: "PROPERTY_CREATED",
      payload: { propertyId: property._id, name, area },
    });

    return res.status(201).json(property);

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
export const updateProperty = async (req, res) => {
  try {
    const allowedFields = [
      "name", "area", "gender", "propertyType", "priority", "nblr",
      "food", "usp", "vibe", "amenities", "ownerCode", "zoneId", "locality",
    ];

    const update = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) update[field] = req.body[field];
    }

    const property = await Property.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!property) return res.status(404).json({ message: "Property not found" });

    return res.status(200).json(property);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const createRoom = async (req, res) => {
  try {
    const { propertyId, roomType, price, vacancies = 0 } = req.body;

    if (!propertyId || !roomType || price === undefined) {
      return res.status(400).json({ message: "propertyId, roomType and price are required" });
    }

    const property = await Property.findById(propertyId);
    if (!property) return res.status(404).json({ message: "Property not found" });

    const room = await Room.create({
      propertyId,
      roomType,
      price,
      vacancies,
      retail: { retailStatus: "open" },
      availability: { availabilityType: "immediate" },
    });

    return res.status(201).json(room);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
export const getProperties = async (req, res) => {
  try {
    let filter = {};

    if (req.user.role !== "admin") {
      filter.createdBy = req.user._id;
    }

    const results = await Property.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      count: results.length,
      results
    });

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
export const getPropertyRequests = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const results = await PropertyRequest.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({ count: results.length, results });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const updatePropertyRequest = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status is required" });

    const request = await PropertyRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!request) return res.status(404).json({ message: "Request not found" });

    return res.status(200).json(request);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};