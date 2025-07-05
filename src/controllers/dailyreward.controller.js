import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import prisma from "../../prismaClient.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create a new daily reward
const createDailyReward = asyncHandler(async (req, res) => {
  const { type, amount, dailyId } = req.body;

  if (!type || !amount || !dailyId) {
    throw new ApiError(400, "Type, amount, and dailyId are required");
  }

  const dailyReward = await prisma.dailyReward.create({
    data: {
      type,
      amount,
      dailyId
    },
    include: {
      daily: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
  });

  return res.status(201).json(
    new ApiResponse(201, dailyReward, "Daily reward created successfully")
  );
});

// Get all daily rewards for a daily challenge
const getDailyChallengeRewards = asyncHandler(async (req, res) => {
  const { dailyId } = req.params;

  if (!dailyId) {
    throw new ApiError(400, "Daily challenge ID is required");
  }

  const rewards = await prisma.dailyReward.findMany({
    where: { dailyId: parseInt(dailyId) },
    include: {
      daily: {
        select: {
          id: true,
          date: true,
          userId: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

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

  const reward = await prisma.dailyReward.findUnique({
    where: { id: parseInt(rewardId) },
    include: {
      daily: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    }
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

  const reward = await prisma.dailyReward.update({
    where: { id: parseInt(rewardId) },
    data: {
      ...(type && { type }),
      ...(amount !== undefined && { amount })
    },
    include: {
      daily: {
        select: {
          id: true,
          date: true,
          userId: true
        }
      }
    }
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

  await prisma.dailyReward.delete({
    where: { id: parseInt(rewardId) }
  });

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
