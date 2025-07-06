import mongoose from "mongoose";

const challengeHistorySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  rewardsClaimed: { type: Boolean, default: false },
  dailyId: { type: mongoose.Schema.Types.ObjectId, ref: "DailyChallenge", required: true },
}, { timestamps: true });

export default mongoose.model("ChallengeHistory", challengeHistorySchema);
