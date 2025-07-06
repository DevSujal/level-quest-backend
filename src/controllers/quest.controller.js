import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Quest from "../models/quest.model.js";
import Reward from "../models/reward.model.js";
import SubQuest from "../models/subquest.model.js";
import User from "../models/user.model.js";
import Stat from "../models/stat.model.js";

const createQuest = asyncHandler(async (req, res) => {
  const { image, name, endDate, description, priority, userId, rewards, subQuests } = req.body;

  if (!name || !endDate || !description || !userId) {
    throw new ApiError(400, "Name, endDate, description, and userId are required");
  }

  let rewardDocs = [];
  let subQuestDocs = [];
  if (rewards && rewards.length > 0) {
    rewardDocs = await Reward.insertMany(rewards);
  }
  if (subQuests && subQuests.length > 0) {
    subQuestDocs = await SubQuest.insertMany(subQuests);
  }

  const quest = await Quest.create({
    image: image || "",
    name,
    endDate: new Date(endDate),
    description,
    priority: priority || 1,
    userId,
    rewards: rewardDocs.map((r) => r._id),
    subQuests: subQuestDocs.map((s) => s._id),
  });

  const populated = await Quest.findById(quest._id)
    .populate("rewards")
    .populate({ path: "subQuests", populate: { path: "rewards" } })
    .populate({ path: "userId", select: "_id name email" });

  return res.status(201).json(
    new ApiResponse(201, populated, "Quest created successfully")
  );
});

const getUserQuests = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const quests = await Quest.find({ userId })
    .populate("rewards")
    .populate("subQuests")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, quests, "Quests retrieved successfully")
  );
});

const getQuestById = asyncHandler(async (req, res) => {
  const { questId } = req.params;

  if (!questId) {
    throw new ApiError(400, "Quest ID is required");
  }

  const quest = await Quest.findById(questId)
    .populate("rewards")
    .populate({ path: "subQuests", populate: { path: "rewards" } })
    .populate({ path: "userId", select: "_id name email" });

  if (!quest) {
    throw new ApiError(404, "Quest not found");
  }

  return res.status(200).json(
    new ApiResponse(200, quest, "Quest retrieved successfully")
  );
});

const updateQuest = asyncHandler(async (req, res) => {
  const { questId } = req.params;
  const { image, name, endDate, description, priority, isCompleted } = req.body;

  if (!questId) {
    throw new ApiError(400, "Quest ID is required");
  }

  const update = {};
  if (image !== undefined) update.image = image;
  if (name) update.name = name;
  if (endDate) update.endDate = new Date(endDate);
  if (description) update.description = description;
  if (priority !== undefined) update.priority = priority;
  if (isCompleted !== undefined) update.isCompleted = isCompleted;

  const quest = await Quest.findByIdAndUpdate(questId, update, { new: true })
    .populate("rewards")
    .populate("subQuests");

  return res.status(200).json(
    new ApiResponse(200, quest, "Quest updated successfully")
  );
});

const deleteQuest = asyncHandler(async (req, res) => {
  const { questId } = req.params;

  if (!questId) {
    throw new ApiError(400, "Quest ID is required");
  }

  await Quest.findByIdAndDelete(questId);

  return res.status(200).json(
    new ApiResponse(200, null, "Quest deleted successfully")
  );
});

const completeQuest = asyncHandler(async (req, res) => {
  const { questId } = req.params;

  if (!questId) {
    throw new ApiError(400, "Quest ID is required");
  }

  const quest = await Quest.findByIdAndUpdate(
    questId,
    { isCompleted: true },
    { new: true }
  )
    .populate("rewards")
    .populate({ path: "userId" });

  // Apply rewards to user
  if (quest.rewards && quest.rewards.length > 0) {
    for (const reward of quest.rewards) {
      if (reward.type === "COINS") {
        await User.findByIdAndUpdate(quest.userId, { $inc: { coins: reward.amount } });
      } else if (reward.type === "EXPERIENCE") {
        await User.findByIdAndUpdate(quest.userId, { $inc: { exp: reward.amount } });
      } else if (reward.type === "SKILL" && reward.skill) {
        let existingStat = await Stat.findOne({ userId: quest.userId, skill: reward.skill });
        if (existingStat) {
          await Stat.findByIdAndUpdate(existingStat._id, { $inc: { value: reward.amount } });
        } else {
          await Stat.create({ skill: reward.skill, value: reward.amount, userId: quest.userId });
        }
      }
    }
  }

  return res.status(200).json(
    new ApiResponse(200, quest, "Quest completed successfully")
  );
});

export {
  createQuest,
  getUserQuests,
  getQuestById,
  updateQuest,
  deleteQuest,
  completeQuest,
};


