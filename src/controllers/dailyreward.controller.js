import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import DailyReward from "../models/dailyreward.model.js";
import DailyChallenge from "../models/dailychallenge.model.js";
import User from "../models/user.model.js";

// Create a new daily reward
const createDailyReward = asyncHandler(async (req, res) => {
  const { type, amount, dailyId } = req.body;

  if (!type || !amount || !dailyId) {
    throw new ApiError(400, "Type, amount, and dailyId are required");
  }

  const dailyReward = await DailyReward.create({
    type,
    amount,
    dailyId
  });

  const populated = await DailyReward.findById(dailyReward._id)
    .populate({
      path: "dailyId",
      populate: { path: "userId", select: "_id name email" }
    });

  return res.status(201).json(
    new ApiResponse(201, populated, "Daily reward created successfully")
  );
});

// Get all daily rewards for a daily challenge
const getDailyChallengeRewards = asyncHandler(async (req, res) => {
  const { dailyId } = req.params;

  if (!dailyId) {
    throw new ApiError(400, "Daily challenge ID is required");
  }

  const rewards = await DailyReward.find({ dailyId })
    .populate({
      path: "dailyId",
      select: "_id date userId"
    })
    .sort({ createdAt: 1 });

  return res.status(200).json(
    new ApiResponse(200, rewards, "Daily challenge rewards retrieved successfully")
  );
});

// Get daily reward by ID
const getDailyRewardById = asyncHandler(async (req, res) => {
  const { rewardId } = req.params;

  if (!rewardId) {
    throw new ApiError(400, "Reward ID is required");
  }

  const reward = await DailyReward.findById(rewardId)
    .populate({
      path: "dailyId",
      populate: { path: "userId", select: "_id name email" }
    });

  if (!reward) {
    throw new ApiError(404, "Daily reward not found");
  }

  return res.status(200).json(
    new ApiResponse(200, reward, "Daily reward retrieved successfully")
  );
});

// Update daily reward
const updateDailyReward = asyncHandler(async (req, res) => {
  const { rewardId } = req.params;
  const { type, amount } = req.body;

  if (!rewardId) {
    throw new ApiError(400, "Reward ID is required");
  }

  const update = {};
  if (type) update.type = type;
  if (amount !== undefined) update.amount = amount;

  const reward = await DailyReward.findByIdAndUpdate(rewardId, update, { new: true })
    .populate({
      path: "dailyId",
      select: "_id date userId"
    });

  return res.status(200).json(
    new ApiResponse(200, reward, "Daily reward updated successfully")
  );
});

// Delete daily reward
const deleteDailyReward = asyncHandler(async (req, res) => {
  const { rewardId } = req.params;

  if (!rewardId) {
    throw new ApiError(400, "Reward ID is required");
  }

  await DailyReward.findByIdAndDelete(rewardId);

  return res.status(200).json(
    new ApiResponse(200, null, "Daily reward deleted successfully")
  );
});

export {
  createDailyReward,
  getDailyChallengeRewards,
  getDailyRewardById,
  updateDailyReward,
  deleteDailyReward
};
