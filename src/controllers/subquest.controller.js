import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import prisma from "../../prismaClient.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create a new subquest
const createSubQuest = asyncHandler(async (req, res) => {
  const { name, completed, claim, questId, rewards } = req.body;

  if (!name || !questId) {
    throw new ApiError(400, "Name and questId are required");
  }

  const subQuest = await prisma.subQuest.create({
    data: {
      name,
      completed: completed || false,
      claim: claim || false,
      questId,
      rewards: rewards ? {
        create: rewards.map(reward => ({
          type: reward.type,
          amount: reward.amount,
          skill: reward.skill,
          itemId: reward.itemId
        }))
      } : undefined
    },
    include: {
      rewards: true,
      quest: {
        select: {
          id: true,
          name: true,
          userId: true
        }
      }
    }
  });

  return res.status(201).json(
    new ApiResponse(201, subQuest, "SubQuest created successfully")
  );
});

// Get all subquests for a quest
const getQuestSubQuests = asyncHandler(async (req, res) => {
  const { questId } = req.params;

  if (!questId) {
    throw new ApiError(400, "Quest ID is required");
  }

  const subQuests = await prisma.subQuest.findMany({
    where: { questId: parseInt(questId) },
    include: {
      rewards: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

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

  const subQuest = await prisma.subQuest.findUnique({
    where: { id: parseInt(subQuestId) },
    include: {
      rewards: true,
      quest: {
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

  const subQuest = await prisma.subQuest.update({
    where: { id: parseInt(subQuestId) },
    data: {
      ...(name && { name }),
      ...(completed !== undefined && { completed }),
      ...(claim !== undefined && { claim })
    },
    include: {
      rewards: true,
      quest: true
    }
  });

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

  await prisma.subQuest.delete({
    where: { id: parseInt(subQuestId) }
  });

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

  const subQuest = await prisma.subQuest.update({
    where: { id: parseInt(subQuestId) },
    data: { completed: true },
    include: {
      rewards: true,
      quest: {
        include: {
          user: true
        }
      }
    }
  });

  // Apply rewards to user
  if (subQuest.rewards && subQuest.rewards.length > 0) {
    for (const reward of subQuest.rewards) {
      if (reward.type === 'COINS') {
        await prisma.user.update({
          where: { id: subQuest.quest.userId },
          data: { coins: { increment: reward.amount } }
        });
      } else if (reward.type === 'EXPERIENCE') {
        await prisma.user.update({
          where: { id: subQuest.quest.userId },
          data: { exp: { increment: reward.amount } }
        });
      } else if (reward.type === 'SKILL' && reward.skill) {
        // Update or create skill stat
        const existingStat = await prisma.stat.findFirst({
          where: { userId: subQuest.quest.userId, skill: reward.skill }
        });

        if (existingStat) {
          await prisma.stat.update({
            where: { id: existingStat.id },
            data: { value: { increment: reward.amount } }
          });
        } else {
          await prisma.stat.create({
            data: {
              skill: reward.skill,
              value: reward.amount,
              userId: subQuest.quest.userId
            }
          });
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

  const subQuest = await prisma.subQuest.findUnique({
    where: { id: parseInt(subQuestId) },
    include: {
      rewards: true,
      quest: {
        include: {
          user: true
        }
      }
    }
  });

  if (!subQuest) {
    throw new ApiError(404, "SubQuest not found");
  }

  if (!subQuest.completed) {
    throw new ApiError(400, "SubQuest must be completed before claiming rewards");
  }

  if (subQuest.claim) {
    throw new ApiError(400, "Rewards already claimed");
  }

  // Update claim status
  const updatedSubQuest = await prisma.subQuest.update({
    where: { id: parseInt(subQuestId) },
    data: { claim: true }
  });

  return res.status(200).json(
    new ApiResponse(200, updatedSubQuest, "SubQuest rewards claimed successfully")
  );
});

export {
  createSubQuest,
  getQuestSubQuests,
  getSubQuestById,
  updateSubQuest,
  deleteSubQuest,
  completeSubQuest,
  claimSubQuestRewards
};
