import mongoose from "mongoose";

const questSchema = new mongoose.Schema({
  image: { type: String, required: true },
  name: { type: String, required: true },
  endDate: { type: Date, required: true },
  description: { type: String, required: true },
  priority: { type: Number, required: true },
  isCompleted: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rewards: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reward" }],
  subQuests: [{ type: mongoose.Schema.Types.ObjectId, ref: "SubQuest" }],
}, { timestamps: true });

export default mongoose.model("Quest", questSchema);
