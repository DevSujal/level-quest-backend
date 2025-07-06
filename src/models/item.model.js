import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  claimed: { type: Boolean, default: false },
  attribute_name: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

export default mongoose.model("Item", itemSchema);
