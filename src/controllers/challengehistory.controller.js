import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import prisma from "../../prismaClient.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create a new challenge history entry
const createChallengeHistory = asyncHandler(async (req, res) => {
  const { date, rewardsClaimed, dailyId } = req.body;

  if (!date || !dailyId) {
    throw new ApiError(400, "Date and dailyId are required");
  }

  const challengeHistory = await prisma.challengeHistory.create({
    data: {
      date: new Date(date),
      rewardsClaimed: rewardsClaimed || false,
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
    new ApiResponse(201, challengeHistory, "Challenge history created successfully")
  );
});

// Get all challenge history for a daily challenge
const getDailyChallengeHistory = asyncHandler(async (req, res) => {
  const { dailyId } = req.params;

  if (!dailyId) {
    throw new ApiError(400, "Daily challenge ID is required");
  }

  const history = await prisma.challengeHistory.findMany({
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
      date: 'desc'
    }
  });

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

  const history = await prisma.challengeHistory.findUnique({
    where: { id: parseInt(historyId) },
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

  const history = await prisma.challengeHistory.update({
    where: { id: parseInt(historyId) },
    data: {
      ...(date && { date: new Date(date) }),
      ...(rewardsClaimed !== undefined && { rewardsClaimed })
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
    new ApiResponse(200, history, "Challenge history updated successfully")
  );
});

// Delete challenge history
const deleteChallengeHistory = asyncHandler(async (req, res) => {
  const { historyId } = req.params;

  if (!historyId) {
    throw new ApiError(400, "History ID is required");
  }

  await prisma.challengeHistory.delete({
    where: { id: parseInt(historyId) }
  });

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

  const history = await prisma.challengeHistory.findMany({
    where: {
      daily: {
        userId: parseInt(userId)
      }
    },
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
      date: 'desc'
    }
  });

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
