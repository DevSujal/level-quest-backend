import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    profilePic: String,
    password: { type: String, required: true },
    refreshToken: String,
    level: { type: Number, default: 1 },
    exp: { type: Number, default: 50 },
    health: { type: Number, default: 100 },
    coins: { type: Number, default: 1000 },
    job: String,
    about: String,
    strength: String,
    weakness: String,
    masterObjective: String,
    minorObjective: String,
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
