import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import prisma from "../../prismaClient.js";
import asyncHandler from "../utils/asyncHandler.js";

/*model Quest {
  id          Int      @id @default(autoincrement())
  image       String
  name        String
  endDate     DateTime
  description String
  priority    Int
  status      String

  userId Int
  user   User @relation(fields: [userId], references: [id])

  rewards   Reward[]
  subQuests SubQuest[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}*/

const createQuest = asyncHandler(async (req, res) => {
  const { image, name, endDate, description, priority, userId, rewards, subQuests } = req.body;

  if (!name || !endDate || !description || !userId) {
    throw new ApiError(400, "Name, endDate, description, and userId are required");
  }

  const quest = await prisma.quest.create({
    data: {
      image: image || "",
      name,
      endDate: new Date(endDate),
      description,
      priority: priority || 1,
      userId,
      rewards: rewards ? {
        create: rewards.map(reward => ({
          type: reward.type,
          amount: reward.amount,
          skill: reward.skill,
          itemId: reward.itemId
        }))
      } : undefined,
      subQuests: subQuests ? {
        create: subQuests.map(subQuest => ({
          name: subQuest.name,
          completed: subQuest.completed || false,
          claim: subQuest.claim || false
        }))
      } : undefined
    },
    include: {
      rewards: true,
      subQuests: true,
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
    new ApiResponse(201, quest, "Quest created successfully")
  );
});

// Get all quests for a user
const getUserQuests = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const quests = await prisma.quest.findMany({
    where: { userId: parseInt(userId) },
    include: {
      rewards: true,
      subQuests: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return res.status(200).json(
    new ApiResponse(200, quests, "Quests retrieved successfully")
  );
});

// Get quest by ID
const getQuestById = asyncHandler(async (req, res) => {
  const { questId } = req.params;

  if (!questId) {
    throw new ApiError(400, "Quest ID is required");
  }

  const quest = await prisma.quest.findUnique({
    where: { id: parseInt(questId) },
    include: {
      rewards: true,
      subQuests: {
        include: {
          rewards: true
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!quest) {
    throw new ApiError(404, "Quest not found");
  }

  return res.status(200).json(
    new ApiResponse(200, quest, "Quest retrieved successfully")
  );
});

// Update quest
const updateQuest = asyncHandler(async (req, res) => {
  const { questId } = req.params;
  const { image, name, endDate, description, priority, isCompleted } = req.body;

  if (!questId) {
    throw new ApiError(400, "Quest ID is required");
  }

  const quest = await prisma.quest.update({
    where: { id: parseInt(questId) },
    data: {
      ...(image !== undefined && { image }),
      ...(name && { name }),
      ...(endDate && { endDate: new Date(endDate) }),
      ...(description && { description }),
      ...(priority !== undefined && { priority }),
      ...(isCompleted !== undefined && { isCompleted })
    },
    include: {
      rewards: true,
      subQuests: true
    }
  });

  return res.status(200).json(
    new ApiResponse(200, quest, "Quest updated successfully")
  );
});

// Delete quest
const deleteQuest = asyncHandler(async (req, res) => {
  const { questId } = req.params;

  if (!questId) {
    throw new ApiError(400, "Quest ID is required");
  }

  await prisma.quest.delete({
    where: { id: parseInt(questId) }
  });

  return res.status(200).json(
    new ApiResponse(200, null, "Quest deleted successfully")
  );
});

// Complete quest
const completeQuest = asyncHandler(async (req, res) => {
  const { questId } = req.params;

  if (!questId) {
    throw new ApiError(400, "Quest ID is required");
  }

  const quest = await prisma.quest.update({
    where: { id: parseInt(questId) },
    data: { isCompleted: true },
    include: {
      rewards: true,
      user: true
    }
  });

  // Apply rewards to user
  if (quest.rewards && quest.rewards.length > 0) {
    for (const reward of quest.rewards) {
      if (reward.type === 'COINS') {
        await prisma.user.update({
          where: { id: quest.userId },
          data: { coins: { increment: reward.amount } }
        });
      } else if (reward.type === 'EXPERIENCE') {
        await prisma.user.update({
          where: { id: quest.userId },
          data: { exp: { increment: reward.amount } }
        });
      } else if (reward.type === 'SKILL' && reward.skill) {
        // Update or create skill stat
        const existingStat = await prisma.stat.findFirst({
          where: { userId: quest.userId, skill: reward.skill }
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
              userId: quest.userId
            }
          });
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
  completeQuest
};


