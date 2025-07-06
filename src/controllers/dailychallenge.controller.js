import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import DailyChallenge from "../models/dailychallenge.model.js";
import Challenge from "../models/challenge.model.js";
import Reward from "../models/reward.model.js";
import User from "../models/user.model.js";
import ChallengeHistory from "../models/challengehistory.model.js";

// Create a new daily challenge
const createDailyChallenge = asyncHandler(async (req, res) => {
  const { date, userId, challenges, rewards } = req.body;

  if (!date || !userId) {
    throw new ApiError(400, "Date and userId are required");
  }

  // Create challenge and reward documents if provided
  let challengeDocs = [];
  let rewardDocs = [];
  if (challenges && challenges.length > 0) {
    challengeDocs = await Challenge.insertMany(
      challenges.map((challenge) => ({
        ...challenge,
        completed: challenge.completed || false,
      }))
    );
  }
  if (rewards && rewards.length > 0) {
    rewardDocs = await Reward.insertMany(rewards);
  }

  const dailyChallenge = await DailyChallenge.create({
    date: new Date(date),
    userId,
    challenges: challengeDocs.map((c) => c._id),
    rewards: rewardDocs.map((r) => r._id),
  });

  const populated = await DailyChallenge.findById(dailyChallenge._id)
    .populate({ path: "challenges" })
    .populate({ path: "rewards" })
    .populate({ path: "userId", select: "_id name email" });

  return res.status(201).json(
    new ApiResponse(201, populated, "Daily challenge created successfully")
  );
});

// Get all daily challenges for a user
const getUserDailyChallenges = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const dailyChallenges = await DailyChallenge.find({ userId })
    .populate("challenges")
    .populate("rewards")
    .populate("history")
    .sort({ date: -1 });

  return res.status(200).json(
    new ApiResponse(200, dailyChallenges, "Daily challenges retrieved successfully")
  );
});

// Get daily challenge by ID
const getDailyChallengeById = asyncHandler(async (req, res) => {
  const { dailyChallengeId } = req.params;

  if (!dailyChallengeId) {
    throw new ApiError(400, "Daily challenge ID is required");
  }

  const dailyChallenge = await DailyChallenge.findById(dailyChallengeId)
    .populate("challenges")
    .populate("rewards")
    .populate("history")
    .populate({ path: "userId", select: "_id name email" });

  if (!dailyChallenge) {
    throw new ApiError(404, "Daily challenge not found");
  }

  return res.status(200).json(
    new ApiResponse(200, dailyChallenge, "Daily challenge retrieved successfully")
  );
});

// Get today's daily challenge for a user
const getTodayChallenge = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  const todayChallenge = await DailyChallenge.findOne({
    userId,
    date: { $gte: today, $lt: tomorrow },
  })
    .populate("challenges")
    .populate("rewards")
    .populate("history");

  return res.status(200).json(
    new ApiResponse(200, todayChallenge, "Today's challenge retrieved successfully")
  );
});

// Update daily challenge
const updateDailyChallenge = asyncHandler(async (req, res) => {
  const { dailyChallengeId } = req.params;
  const { date, claimedDate } = req.body;

  if (!dailyChallengeId) {
    throw new ApiError(400, "Daily challenge ID is required");
  }

  const update = {};
  if (date) update.date = new Date(date);
  if (claimedDate !== undefined) update.claimedDate = claimedDate ? new Date(claimedDate) : null;

  const dailyChallenge = await DailyChallenge.findByIdAndUpdate(
    dailyChallengeId,
    update,
    { new: true }
  )
    .populate("challenges")
    .populate("rewards")
    .populate("history");

  return res.status(200).json(
    new ApiResponse(200, dailyChallenge, "Daily challenge updated successfully")
  );
});

// Delete daily challenge
const deleteDailyChallenge = asyncHandler(async (req, res) => {
  const { dailyChallengeId } = req.params;

  if (!dailyChallengeId) {
    throw new ApiError(400, "Daily challenge ID is required");
  }

  await DailyChallenge.findByIdAndDelete(dailyChallengeId);

  return res.status(200).json(
    new ApiResponse(200, null, "Daily challenge deleted successfully")
  );
});

// Claim daily challenge rewards
const claimDailyRewards = asyncHandler(async (req, res) => {
  const { dailyChallengeId } = req.params;

  if (!dailyChallengeId) {
    throw new ApiError(400, "Daily challenge ID is required");
  }

  const dailyChallenge = await DailyChallenge.findById(dailyChallengeId)
    .populate("challenges")
    .populate("rewards")
    .populate("userId");

  if (!dailyChallenge) {
    throw new ApiError(404, "Daily challenge not found");
  }

  if (dailyChallenge.claimedDate) {
    throw new ApiError(400, "Rewards already claimed");
  }

  // Check if all challenges are completed
  const allCompleted = dailyChallenge.challenges.every((challenge) => challenge.completed);
  if (!allCompleted) {
    throw new ApiError(400, "All challenges must be completed before claiming rewards");
  }

  // Update claimed date
  dailyChallenge.claimedDate = new Date();
  await dailyChallenge.save();

  // Apply rewards to user
  if (dailyChallenge.rewards && dailyChallenge.rewards.length > 0) {
    for (const reward of dailyChallenge.rewards) {
      if (reward.type === "COINS") {
        await User.findByIdAndUpdate(
          dailyChallenge.userId._id,
          { $inc: { coins: reward.amount } }
        );
      } else if (reward.type === "EXPERIENCE") {
        await User.findByIdAndUpdate(
          dailyChallenge.userId._id,
          { $inc: { exp: reward.amount } }
        );
      }
    }
  }

  const updatedDailyChallenge = await DailyChallenge.findById(dailyChallengeId)
    .populate("rewards")
    .populate("userId");

  return res.status(200).json(
    new ApiResponse(200, updatedDailyChallenge, "Daily challenge rewards claimed successfully")
  );
});

export {
  createDailyChallenge,
  getUserDailyChallenges,
  getDailyChallengeById,
  getTodayChallenge,
  updateDailyChallenge,
  deleteDailyChallenge,
  claimDailyRewards,
};
