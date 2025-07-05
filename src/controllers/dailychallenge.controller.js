import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import prisma from "../../prismaClient.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create a new daily challenge
const createDailyChallenge = asyncHandler(async (req, res) => {
  const { date, userId, challenges, rewards } = req.body;

  if (!date || !userId) {
    throw new ApiError(400, "Date and userId are required");
  }

  const dailyChallenge = await prisma.dailyChallenge.create({
    data: {
      date: new Date(date),
      userId,
      challenges: challenges ? {
        create: challenges.map(challenge => ({
          name: challenge.name,
          description: challenge.description,
          completed: challenge.completed || false,
          skill: challenge.skill
        }))
      } : undefined,
      rewards: rewards ? {
        create: rewards.map(reward => ({
          type: reward.type,
          amount: reward.amount
        }))
      } : undefined
    },
    include: {
      challenges: true,
      rewards: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  return res.status(201).json(
    new ApiResponse(201, dailyChallenge, "Daily challenge created successfully")
  );
});

// Get all daily challenges for a user
const getUserDailyChallenges = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const dailyChallenges = await prisma.dailyChallenge.findMany({
    where: { userId: parseInt(userId) },
    include: {
      challenges: true,
      rewards: true,
      history: true
    },
    orderBy: {
      date: 'desc'
    }
  });

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

  const dailyChallenge = await prisma.dailyChallenge.findUnique({
    where: { id: parseInt(dailyChallengeId) },
    include: {
      challenges: true,
      rewards: true,
      history: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

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

  const todayChallenge = await prisma.dailyChallenge.findFirst({
    where: {
      userId: parseInt(userId),
      date: {
        gte: today,
        lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    },
    include: {
      challenges: true,
      rewards: true,
      history: true
    }
  });

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

  const dailyChallenge = await prisma.dailyChallenge.update({
    where: { id: parseInt(dailyChallengeId) },
    data: {
      ...(date && { date: new Date(date) }),
      ...(claimedDate !== undefined && { claimedDate: claimedDate ? new Date(claimedDate) : null })
    },
    include: {
      challenges: true,
      rewards: true,
      history: true
    }
  });

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

  await prisma.dailyChallenge.delete({
    where: { id: parseInt(dailyChallengeId) }
  });

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

  const dailyChallenge = await prisma.dailyChallenge.findUnique({
    where: { id: parseInt(dailyChallengeId) },
    include: {
      challenges: true,
      rewards: true,
      user: true
    }
  });

  if (!dailyChallenge) {
    throw new ApiError(404, "Daily challenge not found");
  }

  if (dailyChallenge.claimedDate) {
    throw new ApiError(400, "Rewards already claimed");
  }

  // Check if all challenges are completed
  const allCompleted = dailyChallenge.challenges.every(challenge => challenge.completed);
  if (!allCompleted) {
    throw new ApiError(400, "All challenges must be completed before claiming rewards");
  }

  // Update claimed date
  const updatedDailyChallenge = await prisma.dailyChallenge.update({
    where: { id: parseInt(dailyChallengeId) },
    data: { claimedDate: new Date() },
    include: {
      rewards: true,
      user: true
    }
  });

  // Apply rewards to user
  if (dailyChallenge.rewards && dailyChallenge.rewards.length > 0) {
    for (const reward of dailyChallenge.rewards) {
      if (reward.type === 'COINS') {
        await prisma.user.update({
          where: { id: dailyChallenge.userId },
          data: { coins: { increment: reward.amount } }
        });
      } else if (reward.type === 'EXPERIENCE') {
        await prisma.user.update({
          where: { id: dailyChallenge.userId },
          data: { exp: { increment: reward.amount } }
        });
      }
    }
  }

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
  claimDailyRewards
};
