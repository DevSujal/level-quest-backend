import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import ChallengeHistory from "../models/challengehistory.model.js";
import DailyChallenge from "../models/dailychallenge.model.js";
import User from "../models/user.model.js";

// Create a new challenge history entry
const createChallengeHistory = asyncHandler(async (req, res) => {
  const { date, rewardsClaimed, dailyId } = req.body;

  if (!date || !dailyId) {
    throw new ApiError(400, "Date and dailyId are required");
  }

  const challengeHistory = await ChallengeHistory.create({
    date: new Date(date),
    rewardsClaimed: rewardsClaimed || false,
    dailyId
  });

  const populated = await ChallengeHistory.findById(challengeHistory._id)
    .populate({
      path: "dailyId",
      populate: { path: "userId", select: "_id name email" }
    });

  return res.status(201).json(
    new ApiResponse(201, populated, "Challenge history created successfully")
  );
});

// Get all challenge history for a daily challenge
const getDailyChallengeHistory = asyncHandler(async (req, res) => {
  const { dailyId } = req.params;

  if (!dailyId) {
    throw new ApiError(400, "Daily challenge ID is required");
  }

  const history = await ChallengeHistory.find({ dailyId })
    .populate({
      path: "dailyId",
      select: "_id date userId"
    })
    .sort({ date: -1 });

  return res.status(200).json(
    new ApiResponse(200, history, "Challenge history retrieved successfully")
  );
});

// Get challenge history by ID
const getChallengeHistoryById = asyncHandler(async (req, res) => {
  const { historyId } = req.params;

  if (!historyId) {
    throw new ApiError(400, "History ID is required");
  }

  const history = await ChallengeHistory.findById(historyId)
    .populate({
      path: "dailyId",
      populate: { path: "userId", select: "_id name email" }
    });

  if (!history) {
    throw new ApiError(404, "Challenge history not found");
  }

  return res.status(200).json(
    new ApiResponse(200, history, "Challenge history retrieved successfully")
  );
});

// Update challenge history
const updateChallengeHistory = asyncHandler(async (req, res) => {
  const { historyId } = req.params;
  const { date, rewardsClaimed } = req.body;

  if (!historyId) {
    throw new ApiError(400, "History ID is required");
  }

  const update = {};
  if (date) update.date = new Date(date);
  if (rewardsClaimed !== undefined) update.rewardsClaimed = rewardsClaimed;

  const history = await ChallengeHistory.findByIdAndUpdate(historyId, update, { new: true })
    .populate({ path: "dailyId", select: "_id date userId" });

  return res.status(200).json(
    new ApiResponse(200, history, "Challenge history updated successfully")
  );
});

// Delete challenge history
const deleteChallengeHistory = asyncHandler(async (req, res) => {
  const { historyId } = req.params;

  if (!historyId) {
    throw new ApiError(400, "History ID is required");
  }

  await ChallengeHistory.findByIdAndDelete(historyId);

  return res.status(200).json(
    new ApiResponse(200, null, "Challenge history deleted successfully")
  );
});

// Get user's challenge history
const getUserChallengeHistory = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  // Find all daily challenges for the user
  const dailyChallenges = await DailyChallenge.find({ userId });
  const dailyIds = dailyChallenges.map((d) => d._id);

  const history = await ChallengeHistory.find({ dailyId: { $in: dailyIds } })
    .populate({ path: "dailyId", select: "_id date userId" })
    .sort({ date: -1 });

  return res.status(200).json(
    new ApiResponse(200, history, "User challenge history retrieved successfully")
  );
});

export {
  createChallengeHistory,
  getDailyChallengeHistory,
  getChallengeHistoryById,
  updateChallengeHistory,
  deleteChallengeHistory,
  getUserChallengeHistory
};
