import mongoose from "mongoose";

const dailyChallengeSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    claimedDate: Date,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    challenges: [{ type: mongoose.Schema.Types.ObjectId, ref: "Challenge" }],
    history: [
      { type: mongoose.Schema.Types.ObjectId, ref: "ChallengeHistory" },
    ],
    rewards: [{ type: mongoose.Schema.Types.ObjectId, ref: "DailyReward" }],
  },
  { timestamps: true }
);

export default mongoose.model("DailyChallenge", dailyChallengeSchema);
