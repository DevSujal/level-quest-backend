import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Stat from "../models/stat.model.js";
import User from "../models/user.model.js";

// Create a new stat
const createStat = asyncHandler(async (req, res) => {
  const { skill, level, value, userId } = req.body;

  if (!skill || !userId) {
    throw new ApiError(400, "Skill and userId are required");
  }

  const stat = await Stat.create({
    skill,
    level: level || 1,
    value: value || 0,
    userId
  });

  const populatedStat = await Stat.findById(stat._id).populate({
    path: "userId",
    select: "_id name email"
  });

  return res.status(201).json(
    new ApiResponse(201, populatedStat, "Stat created successfully")
  );
});

// Get all stats for a user
const getUserStats = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const stats = await Stat.find({ userId })
    .populate({ path: "userId", select: "_id name email" })
    .sort({ skill: 1 });

  return res.status(200).json(
    new ApiResponse(200, stats, "Stats retrieved successfully")
  );
});

// Get stat by ID
const getStatById = asyncHandler(async (req, res) => {
  const { statId } = req.params;

  if (!statId) {
    throw new ApiError(400, "Stat ID is required");
  }

  const stat = await Stat.findById(statId).populate({
    path: "userId",
    select: "_id name email"
  });

  if (!stat) {
    throw new ApiError(404, "Stat not found");
  }

  return res.status(200).json(
    new ApiResponse(200, stat, "Stat retrieved successfully")
  );
});

// Update stat
const updateStat = asyncHandler(async (req, res) => {
  const { statId } = req.params;
  const { skill, level, value } = req.body;

  if (!statId) {
    throw new ApiError(400, "Stat ID is required");
  }

  const update = {};
  if (skill) update.skill = skill;
  if (level !== undefined) update.level = level;
  if (value !== undefined) update.value = value;

  const stat = await Stat.findByIdAndUpdate(statId, update, { new: true }).populate({
    path: "userId",
    select: "_id name email"
  });

  return res.status(200).json(
    new ApiResponse(200, stat, "Stat updated successfully")
  );
});

// Delete stat
const deleteStat = asyncHandler(async (req, res) => {
  const { statId } = req.params;

  if (!statId) {
    throw new ApiError(400, "Stat ID is required");
  }

  await Stat.findByIdAndDelete(statId);

  return res.status(200).json(
    new ApiResponse(200, null, "Stat deleted successfully")
  );
});

// Increment stat value
const incrementStat = asyncHandler(async (req, res) => {
  const { statId } = req.params;
  const { amount } = req.body;

  if (!statId) {
    throw new ApiError(400, "Stat ID is required");
  }

  const incrementAmount = amount || 1;

  // Get current stat
  const statDoc = await Stat.findById(statId);
  if (!statDoc) {
    throw new ApiError(404, "Stat not found");
  }
  const newValue = statDoc.value + incrementAmount;
  const newLevel = Math.floor(newValue / 100) + 1;

  const stat = await Stat.findByIdAndUpdate(
    statId,
    { $inc: { value: incrementAmount }, level: newLevel },
    { new: true }
  ).populate({ path: "userId", select: "_id name email" });

  return res.status(200).json(
    new ApiResponse(200, stat, "Stat incremented successfully")
  );
});

// Get stat by skill name for a user
const getUserStatBySkill = asyncHandler(async (req, res) => {
  const { userId, skill } = req.params;

  if (!userId || !skill) {
    throw new ApiError(400, "User ID and skill are required");
  }

  const stat = await Stat.findOne({ userId, skill }).populate({
    path: "userId",
    select: "_id name email"
  });

  return res.status(200).json(
    new ApiResponse(200, stat, "Stat retrieved successfully")
  );
});

export {
  createStat,
  getUserStats,
  getStatById,
  updateStat,
  deleteStat,
  incrementStat,
  getUserStatBySkill
};
