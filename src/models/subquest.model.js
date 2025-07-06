import mongoose from "mongoose";

const subQuestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  completed: { type: Boolean, default: false },
  claim: { type: Boolean, default: false },
  questId: { type: mongoose.Schema.Types.ObjectId, ref: "Quest", required: true },
  rewards: [{ type: mongoose.Schema.Types.ObjectId, ref: "Reward" }],
}, { timestamps: true });

export default mongoose.model("SubQuest", subQuestSchema);
