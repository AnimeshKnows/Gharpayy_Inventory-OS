import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    locality: {
      type: String,
      trim: true,
    },
    landmarks: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "unisex"],
    },
    propertyType: {
      type: String,
      enum: ["pg", "hostel", "flat"],
    },
    triplePrice: Number,
    doublePrice: Number,
    singlePrice: Number,
    amenities: [String],
    safety: String,
    commonAreas: String,
    food: Boolean,
    meals: String,
    vibe: String,
    walkDist: String,
    utilities: String,
    deposit: String,
    minStay: String,
    houseRules: String,
    managerContact: String,
    managerName: String,
    mapsLink: String,
    driveLink: String,
    groupName: String,
    usp: String,
    priority: {
      type: String,
      enum: ["super urgent", "push", "normal"],
    },
    nblr: {
      type: Boolean,
      default: false,
    },
    targetAudience: String,
    source: String,
    ownerCode: {
      type: String,
      trim: true,
    },
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Property", propertySchema);