import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["admin", "sales", "owner"],
    },
    area: {
      type: String,
      trim: true,
    },
    ownerCode: {
      type: String,
      trim: true,
      sparse: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("User", userSchema);