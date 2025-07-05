import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import prisma from "../../prismaClient.js";
import asyncHandler from "../utils/asyncHandler.js";

// Create a new task
const createTask = asyncHandler(async (req, res) => {
  const { id, name, userId } = req.body;

  if (!id || !name || !userId) {
    throw new ApiError(400, "ID, name, and userId are required");
  }

  const task = await prisma.task.create({
    data: {
      id,
      name,
      userId,
      isCompleted: false
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
    new ApiResponse(201, task, "Task created successfully")
  );
});

// Get all tasks for a user
const getUserTasks = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const tasks = await prisma.task.findMany({
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
      createdAt: 'desc'
    }
  });

  return res.status(200).json(
    new ApiResponse(200, tasks, "Tasks retrieved successfully")
  );
});

// Get task by ID
const getTaskById = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  if (!taskId) {
    throw new ApiError(400, "Task ID is required");
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
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

  if (!task) {
    throw new ApiError(404, "Task not found");
  }

  return res.status(200).json(
    new ApiResponse(200, task, "Task retrieved successfully")
  );
});

// Update task
const updateTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { name, isCompleted } = req.body;

  if (!taskId) {
    throw new ApiError(400, "Task ID is required");
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(name && { name }),
      ...(isCompleted !== undefined && { isCompleted })
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
    new ApiResponse(200, task, "Task updated successfully")
  );
});

// Delete task
const deleteTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  if (!taskId) {
    throw new ApiError(400, "Task ID is required");
  }

  await prisma.task.delete({
    where: { id: taskId }
  });

  return res.status(200).json(
    new ApiResponse(200, null, "Task deleted successfully")
  );
});

// Complete task
const completeTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  if (!taskId) {
    throw new ApiError(400, "Task ID is required");
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: { isCompleted: true },
    include: {
      user: true
    }
  });

  // Give some experience points for completing a task
  await prisma.user.update({
    where: { id: task.userId },
    data: { exp: { increment: 10 } }
  });

  return res.status(200).json(
    new ApiResponse(200, task, "Task completed successfully")
  );
});

// Get tasks by date
const getTasksByDate = asyncHandler(async (req, res) => {
  const { date, userId } = req.params;

  if (!date || !userId) {
    throw new ApiError(400, "Date and userId are required");
  }

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const tasks = await prisma.task.findMany({
    where: {
      userId: parseInt(userId),
      createdAt: {
        gte: startOfDay,
        lte: endOfDay
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
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  return res.status(200).json(
    new ApiResponse(200, tasks, `Tasks retrieved successfully for ${date}`)
  );
});

export {
  createTask,
  getUserTasks,
  getTaskById,
  updateTask,
  deleteTask,
  completeTask,
  getTasksByDate
};
