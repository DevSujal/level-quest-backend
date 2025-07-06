import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Reward from "../models/reward.model.js";
import Quest from "../models/quest.model.js";
import SubQuest from "../models/subquest.model.js";

// Create a new reward
const createReward = asyncHandler(async (req, res) => {
  const { type, amount, skill, questId, subQuestId, itemId } = req.body;

  if (!type || !amount || !itemId) {
    throw new ApiError(400, "Type, amount, and itemId are required");
  }
  if (!questId && !subQuestId) {
    throw new ApiError(400, "Either questId or subQuestId must be provided");
  }

  const reward = await Reward.create({
    type,
    amount,
    skill,
    itemId,
    questId: questId || null,
    subQuestId: subQuestId || null
  });

  const populated = await Reward.findById(reward._id)
    .populate({ path: "questId", select: "_id name userId" })
    .populate({ path: "subQuestId", select: "_id name questId" });

  return res.status(201).json(
    new ApiResponse(201, populated, "Reward created successfully")
  );
});

// Get all rewards for a quest
const getQuestRewards = asyncHandler(async (req, res) => {
  const { questId } = req.params;

  if (!questId) {
    throw new ApiError(400, "Quest ID is required");
  }

  const rewards = await Reward.find({ questId })
    .populate({ path: "questId", select: "_id name userId" });

  return res.status(200).json(
    new ApiResponse(200, rewards, "Quest rewards retrieved successfully")
  );
});

// Get all rewards for a subquest
const getSubQuestRewards = asyncHandler(async (req, res) => {
  const { subQuestId } = req.params;

  if (!subQuestId) {
    throw new ApiError(400, "SubQuest ID is required");
  }

  const rewards = await Reward.find({ subQuestId })
    .populate({ path: "subQuestId", select: "_id name questId" });

  return res.status(200).json(
    new ApiResponse(200, rewards, "SubQuest rewards retrieved successfully")
  );
});

// Get reward by ID
const getRewardById = asyncHandler(async (req, res) => {
  const { rewardId } = req.params;

  if (!rewardId) {
    throw new ApiError(400, "Reward ID is required");
  }

  const reward = await Reward.findById(rewardId)
    .populate({ path: "questId", select: "_id name userId" })
    .populate({ path: "subQuestId", select: "_id name questId" });

  if (!reward) {
    throw new ApiError(404, "Reward not found");
  }

  return res.status(200).json(
    new ApiResponse(200, reward, "Reward retrieved successfully")
  );
});

// Update reward
const updateReward = asyncHandler(async (req, res) => {
  const { rewardId } = req.params;
  const { type, amount, skill, itemId } = req.body;

  if (!rewardId) {
    throw new ApiError(400, "Reward ID is required");
  }

  const update = {};
  if (type) update.type = type;
  if (amount !== undefined) update.amount = amount;
  if (skill !== undefined) update.skill = skill;
  if (itemId !== undefined) update.itemId = itemId;

  const reward = await Reward.findByIdAndUpdate(rewardId, update, { new: true })
    .populate({ path: "questId", select: "_id name userId" })
    .populate({ path: "subQuestId", select: "_id name questId" });

  return res.status(200).json(
    new ApiResponse(200, reward, "Reward updated successfully")
  );
});

// Delete reward
const deleteReward = asyncHandler(async (req, res) => {
  const { rewardId } = req.params;

  if (!rewardId) {
    throw new ApiError(400, "Reward ID is required");
  }

  await Reward.findByIdAndDelete(rewardId);

  return res.status(200).json(
    new ApiResponse(200, null, "Reward deleted successfully")
  );
});

export {
  createReward,
  getQuestRewards,
  getSubQuestRewards,
  getRewardById,
  updateReward,
  deleteReward
};
