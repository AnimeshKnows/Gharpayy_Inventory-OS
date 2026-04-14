import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    roomType: {
      type: String,
      required: true,
      enum: ["single", "double", "triple"],
    },
    price: {
      type: Number,
      required: true,
    },
    vacancies: {
      type: Number,
      default: 0,
    },
    availability: {
      availabilityType: {
        type: String,
        enum: ["immediate", "from date", "not available"],
      },
      availableDate: {
        type: Date,
      },
    },
    retail: {
      retailStatus: {
        type: String,
        enum: ["open", "locked", "approved"],
        default: "open",
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Room", roomSchema);