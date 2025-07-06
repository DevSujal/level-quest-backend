import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import SubQuest from "../models/subquest.model.js";
import Reward from "../models/reward.model.js";
import Quest from "../models/quest.model.js";
import User from "../models/user.model.js";
import Stat from "../models/stat.model.js";

// Create a new subquest
const createSubQuest = asyncHandler(async (req, res) => {
  const { name, completed, claim, questId, rewards } = req.body;

  if (!name || !questId) {
    throw new ApiError(400, "Name and questId are required");
  }

  let rewardDocs = [];
  if (rewards && rewards.length > 0) {
    rewardDocs = await Reward.insertMany(rewards);
  }

  const subQuest = await SubQuest.create({
    name,
    completed: completed || false,
    claim: claim || false,
    questId,
    rewards: rewardDocs.map((r) => r._id),
  });

  const populated = await SubQuest.findById(subQuest._id)
    .populate("rewards")
    .populate({ path: "questId", select: "_id name userId" });

  return res.status(201).json(
    new ApiResponse(201, populated, "SubQuest created successfully")
  );
});

// Get all subquests for a quest
const getQuestSubQuests = asyncHandler(async (req, res) => {
  const { questId } = req.params;

  if (!questId) {
    throw new ApiError(400, "Quest ID is required");
  }

  const subQuests = await SubQuest.find({ questId })
    .populate("rewards")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, subQuests, "SubQuests retrieved successfully")
  );
});

// Get subquest by ID
const getSubQuestById = asyncHandler(async (req, res) => {
  const { subQuestId } = req.params;

  if (!subQuestId) {
    throw new ApiError(400, "SubQuest ID is required");
  }

  const subQuest = await SubQuest.findById(subQuestId)
    .populate("rewards")
    .populate({
      path: "questId",
      populate: { path: "userId", select: "_id name email" },
    });

  if (!subQuest) {
    throw new ApiError(404, "SubQuest not found");
  }

  return res.status(200).json(
    new ApiResponse(200, subQuest, "SubQuest retrieved successfully")
  );
});

// Update subquest
const updateSubQuest = asyncHandler(async (req, res) => {
  const { subQuestId } = req.params;
  const { name, completed, claim } = req.body;

  if (!subQuestId) {
    throw new ApiError(400, "SubQuest ID is required");
  }

  const update = {};
  if (name) update.name = name;
  if (completed !== undefined) update.completed = completed;
  if (claim !== undefined) update.claim = claim;

  const subQuest = await SubQuest.findByIdAndUpdate(subQuestId, update, { new: true })
    .populate("rewards")
    .populate("questId");

  return res.status(200).json(
    new ApiResponse(200, subQuest, "SubQuest updated successfully")
  );
});

// Delete subquest
const deleteSubQuest = asyncHandler(async (req, res) => {
  const { subQuestId } = req.params;

  if (!subQuestId) {
    throw new ApiError(400, "SubQuest ID is required");
  }

  await SubQuest.findByIdAndDelete(subQuestId);

  return res.status(200).json(
    new ApiResponse(200, null, "SubQuest deleted successfully")
  );
});

// Complete subquest
const completeSubQuest = asyncHandler(async (req, res) => {
  const { subQuestId } = req.params;

  if (!subQuestId) {
    throw new ApiError(400, "SubQuest ID is required");
  }

  const subQuest = await SubQuest.findByIdAndUpdate(
    subQuestId,
    { completed: true },
    { new: true }
  )
    .populate("rewards")
    .populate({ path: "questId", populate: { path: "userId" } });

  // Apply rewards to user
  if (subQuest.rewards && subQuest.rewards.length > 0) {
    for (const reward of subQuest.rewards) {
      if (reward.type === "COINS") {
        await User.findByIdAndUpdate(subQuest.questId.userId, { $inc: { coins: reward.amount } });
      } else if (reward.type === "EXPERIENCE") {
        await User.findByIdAndUpdate(subQuest.questId.userId, { $inc: { exp: reward.amount } });
      } else if (reward.type === "SKILL" && reward.skill) {
        // Update or create skill stat
        let existingStat = await Stat.findOne({ userId: subQuest.questId.userId, skill: reward.skill });
        if (existingStat) {
          await Stat.findByIdAndUpdate(existingStat._id, { $inc: { value: reward.amount } });
        } else {
          await Stat.create({ skill: reward.skill, value: reward.amount, userId: subQuest.questId.userId });
        }
      }
    }
  }

  return res.status(200).json(
    new ApiResponse(200, subQuest, "SubQuest completed successfully")
  );
});

// Claim subquest rewards
const claimSubQuestRewards = asyncHandler(async (req, res) => {
  const { subQuestId } = req.params;

  if (!subQuestId) {
    throw new ApiError(400, "SubQuest ID is required");
  }

  const subQuest = await SubQuest.findById(subQuestId);

  if (!subQuest) {
    throw new ApiError(404, "SubQuest not found");
  }

  if (!subQuest.completed) {
    throw new ApiError(400, "SubQuest must be completed before claiming rewards");
  }

  if (subQuest.claim) {
    throw new ApiError(400, "Rewards already claimed");
  }

  subQuest.claim = true;
  await subQuest.save();

  return res.status(200).json(
    new ApiResponse(200, subQuest, "SubQuest rewards claimed successfully")
  );
});

export {
  createSubQuest,
  getQuestSubQuests,
  getSubQuestById,
  updateSubQuest,
  deleteSubQuest,
  completeSubQuest,
  claimSubQuestRewards,
};
