import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import prisma from "../../prismaClient.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create a new challenge
const createChallenge = asyncHandler(async (req, res) => {
  const { name, description, completed, skill, dailyId } = req.body;

  if (!name || !description || !dailyId) {
    throw new ApiError(400, "Name, description, and dailyId are required");
  }

  const challenge = await prisma.challenge.create({
    data: {
      name,
      description,
      completed: completed || false,
      skill,
      dailyId
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

  return res.status(201).json(
    new ApiResponse(201, challenge, "Challenge created successfully")
  );
});

// Get all challenges for a daily challenge
const getDailyChallenges = asyncHandler(async (req, res) => {
  const { dailyId } = req.params;

  if (!dailyId) {
    throw new ApiError(400, "Daily challenge ID is required");
  }

  const challenges = await prisma.challenge.findMany({
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
    new ApiResponse(200, challenges, "Challenges retrieved successfully")
  );
});

// Get challenge by ID
const getChallengeById = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;

  if (!challengeId) {
    throw new ApiError(400, "Challenge ID is required");
  }

  const challenge = await prisma.challenge.findUnique({
    where: { id: parseInt(challengeId) },
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

  const challenge = await prisma.challenge.update({
    where: { id: parseInt(challengeId) },
    data: {
      ...(name && { name }),
      ...(description && { description }),
      ...(completed !== undefined && { completed }),
      ...(skill !== undefined && { skill })
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
    new ApiResponse(200, challenge, "Challenge updated successfully")
  );
});

// Delete challenge
const deleteChallenge = asyncHandler(async (req, res) => {
  const { challengeId } = req.params;

  if (!challengeId) {
    throw new ApiError(400, "Challenge ID is required");
  }

  await prisma.challenge.delete({
    where: { id: parseInt(challengeId) }
  });

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

  const challenge = await prisma.challenge.update({
    where: { id: parseInt(challengeId) },
    data: { completed: true },
    include: {
      daily: {
        include: {
          user: true
        }
      }
    }
  });

  // If challenge has a skill, update user's skill stat
  if (challenge.skill) {
    const existingStat = await prisma.stat.findFirst({
      where: { 
        userId: challenge.daily.userId, 
        skill: challenge.skill 
      }
    });

    if (existingStat) {
      await prisma.stat.update({
        where: { id: existingStat.id },
        data: { value: { increment: 10 } } // Default skill increase
      });
    } else {
      await prisma.stat.create({
        data: {
          skill: challenge.skill,
          value: 10,
          userId: challenge.daily.userId
        }
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
