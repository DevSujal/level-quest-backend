import mongoose from "mongoose";

const challengeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    completed: { type: Boolean, default: false },
    skill: String,
    dailyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DailyChallenge",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Challenge", challengeSchema);
