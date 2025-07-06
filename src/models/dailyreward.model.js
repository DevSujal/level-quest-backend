import mongoose from "mongoose";

const dailyRewardSchema = new mongoose.Schema({
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  dailyId: { type: mongoose.Schema.Types.ObjectId, ref: "DailyChallenge", required: true },
}, { timestamps: true });

export default mongoose.model("DailyReward", dailyRewardSchema);
