import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import prisma from "../../prismaClient.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create a new reward
const createReward = asyncHandler(async (req, res) => {
  const { type, amount, skill, questId, subQuestId, itemId } = req.body;

  if (!type || !amount || !itemId) {
    throw new ApiError(400, "Type, amount, and itemId are required");
  }

  if (!questId && !subQuestId) {
    throw new ApiError(400, "Either questId or subQuestId must be provided");
  }

  const reward = await prisma.reward.create({
    data: {
      type,
      amount,
      skill,
      itemId,
      questId: questId || null,
      subQuestId: subQuestId || null
    },
    include: {
      quest: questId ? {
        select: {
          id: true,
          name: true,
          userId: true
        }
      } : false,
      subQuest: subQuestId ? {
        select: {
          id: true,
          name: true,
          questId: true
        }
      } : false
    }
  });

  return res.status(201).json(
    new ApiResponse(201, reward, "Reward created successfully")
  );
});

// Get all rewards for a quest
const getQuestRewards = asyncHandler(async (req, res) => {
  const { questId } = req.params;

  if (!questId) {
    throw new ApiError(400, "Quest ID is required");
  }

  const rewards = await prisma.reward.findMany({
    where: { questId: parseInt(questId) },
    include: {
      quest: {
        select: {
          id: true,
          name: true,
          userId: true
        }
      }
    }
  });

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

  const rewards = await prisma.reward.findMany({
    where: { subQuestId: parseInt(subQuestId) },
    include: {
      subQuest: {
        select: {
          id: true,
          name: true,
          questId: true
        }
      }
    }
  });

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

  const reward = await prisma.reward.findUnique({
    where: { id: parseInt(rewardId) },
    include: {
      quest: {
        select: {
          id: true,
          name: true,
          userId: true
        }
      },
      subQuest: {
        select: {
          id: true,
          name: true,
          questId: true
        }
      }
    }
  });

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

  const reward = await prisma.reward.update({
    where: { id: parseInt(rewardId) },
    data: {
      ...(type && { type }),
      ...(amount !== undefined && { amount }),
      ...(skill !== undefined && { skill }),
      ...(itemId !== undefined && { itemId })
    },
    include: {
      quest: {
        select: {
          id: true,
          name: true,
          userId: true
        }
      },
      subQuest: {
        select: {
          id: true,
          name: true,
          questId: true
        }
      }
    }
  });

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

  await prisma.reward.delete({
    where: { id: parseInt(rewardId) }
  });

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
