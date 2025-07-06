import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema({
  type: { type: String, required: true }, // SKILL, COINS, EXPERIENCE, ITEM
  amount: { type: Number, required: true },
  skill: String,
  questId: { type: mongoose.Schema.Types.ObjectId, ref: "Quest" },
  subQuestId: { type: mongoose.Schema.Types.ObjectId, ref: "SubQuest" },
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
}, { timestamps: true });

export default mongoose.model("Reward", rewardSchema);
