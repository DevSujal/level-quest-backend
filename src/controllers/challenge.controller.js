import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Challenge from "../models/challenge.model.js";
import DailyChallenge from "../models/dailychallenge.model.js";
import User from "../models/user.model.js";
import Stat from "../models/stat.model.js";

// Create a new challenge
const createChallenge = asyncHandler(async (req, res) => {
  const { name, description, completed, skill, dailyId } = req.body;

  if (!name || !description || !dailyId) {
    throw new ApiError(400, "Name, description, and dailyId are required");
  }

  const challenge = await Challenge.create({
    name,
    description,
    completed: completed || false,
    skill,
    dailyId
  });

  const populated = await Challenge.findById(challenge._id)
    .populate({
      path: "dailyId",
      select: "_id date userId"
    });

  return res.status(201).json(
    new ApiResponse(201, populated, "Challenge created successfully")
  );
});

// Get all challenges for a daily challenge
const getDailyChallenges = asyncHandler(async (req, res) => {
  const { dailyId } = req.params;

  if (!dailyId) {
    throw new ApiError(400, "Daily challenge ID is required");
  }

  const challenges = await Challenge.find({ dailyId })
    .populate({
      path: "dailyId",
      select: "_id date userId"
    })
    .sort({ createdAt: 1 });

  return res.status(200).json(
    new ApiResponse(200, challenges, "Challenges retrieved successfully")
  );
});

// Get challenge by ID
const getChallengeById = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;

  if (!challengeId) {
    throw new ApiError(400, "Challenge ID is required");
  }

  const challenge = await Challenge.findById(challengeId)
    .populate({
      path: "dailyId",
      populate: { path: "userId", select: "_id name email" }
    });

  if (!challenge) {
    throw new ApiError(404, "Challenge not found");
  }

  return res.status(200).json(
    new ApiResponse(200, challenge, "Challenge retrieved successfully")
  );
});

// Update challenge
const updateChallenge = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;
  const { name, description, completed, skill } = req.body;

  if (!challengeId) {
    throw new ApiError(400, "Challenge ID is required");
  }

  const update = {};
  if (name) update.name = name;
  if (description) update.description = description;
  if (completed !== undefined) update.completed = completed;
  if (skill !== undefined) update.skill = skill;

  const challenge = await Challenge.findByIdAndUpdate(challengeId, update, { new: true })
    .populate({ path: "dailyId", select: "_id date userId" });

  return res.status(200).json(
    new ApiResponse(200, challenge, "Challenge updated successfully")
  );
});

// Delete challenge
const deleteChallenge = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;

  if (!challengeId) {
    throw new ApiError(400, "Challenge ID is required");
  }

  await Challenge.findByIdAndDelete(challengeId);

  return res.status(200).json(
    new ApiResponse(200, null, "Challenge deleted successfully")
  );
});

// Complete challenge
const completeChallenge = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;

  if (!challengeId) {
    throw new ApiError(400, "Challenge ID is required");
  }

  const challenge = await Challenge.findByIdAndUpdate(
    challengeId,
    { completed: true },
    { new: true }
  ).populate({
    path: "dailyId",
    populate: { path: "userId" }
  });

  // If challenge has a skill, update user's skill stat
  if (challenge.skill && challenge.dailyId && challenge.dailyId.userId) {
    let existingStat = await Stat.findOne({
      userId: challenge.dailyId.userId,
      skill: challenge.skill
    });
    if (existingStat) {
      await Stat.findByIdAndUpdate(existingStat._id, { $inc: { value: 10 } });
    } else {
      await Stat.create({
        skill: challenge.skill,
        value: 10,
        userId: challenge.dailyId.userId
      });
    }
  }

  return res.status(200).json(
    new ApiResponse(200, challenge, "Challenge completed successfully")
  );
});

export {
  createChallenge,
  getDailyChallenges,
  getChallengeById,
  updateChallenge,
  deleteChallenge,
  completeChallenge
};
