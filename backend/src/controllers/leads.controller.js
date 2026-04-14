import Lead from "../models/Lead.js";

export const getLeads = async (req, res) => {
  try {
    const { status, gender, assignedTo, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (gender) filter.gender = gender;
    if (assignedTo) filter.assignedTo = assignedTo;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 20);
    const skip = (pageNum - 1) * limitNum;

    const [count, results] = await Promise.all([
      Lead.countDocuments(filter),
      Lead.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("assignedTo", "name phone"),
    ]);

    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
export const createLead = async (req, res) => {
  try {
    const lead = new Lead(req.body);
    await lead.save();
    return res.status(201).json(lead);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, assignedTo, maxBudget, location } = req.body;

    const update = {};
    if (status !== undefined) update.status = status;
    if (notes !== undefined) update.notes = notes;
    if (assignedTo !== undefined) update.assignedTo = assignedTo;
    if (maxBudget !== undefined) update.maxBudget = maxBudget;
    if (location !== undefined) update.location = location;

    const lead = await Lead.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    });

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    return res.status(200).json(lead);
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};