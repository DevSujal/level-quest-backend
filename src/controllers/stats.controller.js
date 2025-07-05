import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import prisma from "../../prismaClient.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create a new stat
const createStat = asyncHandler(async (req, res) => {
  const { skill, level, value, userId } = req.body;

  if (!skill || !userId) {
    throw new ApiError(400, "Skill and userId are required");
  }

  const stat = await prisma.stat.create({
    data: {
      skill,
      level: level || 1,
      value: value || 0,
      userId
    },
    include: {
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
    new ApiResponse(201, stat, "Stat created successfully")
  );
});

// Get all stats for a user
const getUserStats = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const stats = await prisma.stat.findMany({
    where: { userId: parseInt(userId) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    },
    orderBy: {
      skill: 'asc'
    }
  });

  return res.status(200).json(
    new ApiResponse(200, stats, "Stats retrieved successfully")
  );
});

// Get stat by ID
const getStatById = asyncHandler(async (req, res) => {
  const { statId } = req.params;

  if (!statId) {
    throw new ApiError(400, "Stat ID is required");
  }

  const stat = await prisma.stat.findUnique({
    where: { id: parseInt(statId) },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!stat) {
    throw new ApiError(404, "Stat not found");
  }

  return res.status(200).json(
    new ApiResponse(200, stat, "Stat retrieved successfully")
  );
});

// Update stat
const updateStat = asyncHandler(async (req, res) => {
  const { statId } = req.params;
  const { skill, level, value } = req.body;

  if (!statId) {
    throw new ApiError(400, "Stat ID is required");
  }

  const stat = await prisma.stat.update({
    where: { id: parseInt(statId) },
    data: {
      ...(skill && { skill }),
      ...(level !== undefined && { level }),
      ...(value !== undefined && { value })
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  return res.status(200).json(
    new ApiResponse(200, stat, "Stat updated successfully")
  );
});

// Delete stat
const deleteStat = asyncHandler(async (req, res) => {
  const { statId } = req.params;

  if (!statId) {
    throw new ApiError(400, "Stat ID is required");
  }

  await prisma.stat.delete({
    where: { id: parseInt(statId) }
  });

  return res.status(200).json(
    new ApiResponse(200, null, "Stat deleted successfully")
  );
});

// Increment stat value
const incrementStat = asyncHandler(async (req, res) => {
  const { statId } = req.params;
  const { amount } = req.body;

  if (!statId) {
    throw new ApiError(400, "Stat ID is required");
  }

  const incrementAmount = amount || 1;

  const stat = await prisma.stat.update({
    where: { id: parseInt(statId) },
    data: { 
      value: { increment: incrementAmount },
      // Level up logic: every 100 points = 1 level
      level: { 
        set: Math.floor((await prisma.stat.findUnique({ where: { id: parseInt(statId) } })).value / 100) + 1 
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  return res.status(200).json(
    new ApiResponse(200, stat, "Stat incremented successfully")
  );
});

// Get stat by skill name for a user
const getUserStatBySkill = asyncHandler(async (req, res) => {
  const { userId, skill } = req.params;

  if (!userId || !skill) {
    throw new ApiError(400, "User ID and skill are required");
  }

  const stat = await prisma.stat.findFirst({
    where: { 
      userId: parseInt(userId),
      skill: skill 
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  return res.status(200).json(
    new ApiResponse(200, stat, "Stat retrieved successfully")
  );
});

export {
  createStat,
  getUserStats,
  getStatById,
  updateStat,
  deleteStat,
  incrementStat,
  getUserStatBySkill
};
