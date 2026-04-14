import Zone from "../models/Zone.js";

export const getZones = async (req, res) => {
  try {
    const results = await Zone.find().sort({ name: 1 });

    const safe = results
      .filter(z => z.name && z.name.trim() !== "")
      .map(z => ({
        _id: z._id,
        name: z.name.trim(),
        areas: z.areas || []
      }));

    return res.status(200).json(safe);

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
export const getZoneById = async (req, res) => {
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) return res.status(404).json({ message: "Zone not found" });
    return res.status(200).json(zone);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const createZone = async (req, res) => {
  try {
    let { name, areas } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Zone name is required" });
    }

    // convert string to array
    if (typeof areas === "string") {
      areas = areas
        .split(",")
        .map(a => a.trim())
        .filter(Boolean);
    }

    // ensure array
    if (!Array.isArray(areas)) {
      areas = [];
    }

    const existing = await Zone.findOne({
      name: { $regex: new RegExp(`^${name}$`, "i") }
    });

    if (existing) {
      return res.status(409).json({ message: "Zone already exists" });
    }

    const zone = await Zone.create({ name, areas });

    return res.status(201).json(zone);

  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateZone = async (req, res) => {
  try {
    const { name, areas } = req.body;

    const update = {};
    if (name !== undefined) update.name = name;
    if (areas !== undefined) update.areas = areas;

    const zone = await Zone.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    });

    if (!zone) return res.status(404).json({ message: "Zone not found" });
    return res.status(200).json(zone);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};