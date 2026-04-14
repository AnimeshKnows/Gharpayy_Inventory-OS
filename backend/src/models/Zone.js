import mongoose from "mongoose";

const zoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    areas: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
export default mongoose.model("Zone", zoneSchema);