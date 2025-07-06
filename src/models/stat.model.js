import mongoose from "mongoose";

const statSchema = new mongoose.Schema({
  skill: { type: String, required: true },
  level: { type: Number, default: 1 },
  value: { type: Number, default: 0 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

export default mongoose.model("Stat", statSchema);
