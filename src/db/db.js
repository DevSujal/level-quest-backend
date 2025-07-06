import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";

export default async function connect() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);

    mongoose.connection.on("connected", () => {
      console.log("Mongodb connected successfully!");
    });
    mongoose.connection.on("error", (err) => {
      console.log("Error :", err.message);
    });
    console.log("Mongo DB connected successfully, ready state:", mongoose.connection.readyState); // 1 means connected
  } catch (error) {
    console.log("Error :", error.message);
    throw new ApiError(500, "mongodb connection not established!");
  }
}
