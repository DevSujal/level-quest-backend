import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Task from "../models/task.model.js";
import User from "../models/user.model.js";

// Create a new task
const createTask = asyncHandler(async (req, res) => {
  const { id, name, userId } = req.body;

  if (!id || !name || !userId) {
    throw new ApiError(400, "ID, name, and userId are required");
  }

  const task = await Task.create({
    _id: id,
    name,
    userId,
    isCompleted: false
  });

  const populatedTask = await Task.findById(task._id).populate({
    path: "userId",
    select: "_id name email"
  });

  return res.status(201).json(
    new ApiResponse(201, populatedTask, "Task created successfully")
  );
});

// Get all tasks for a user
const getUserTasks = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }

  const tasks = await Task.find({ userId })
    .populate({ path: "userId", select: "_id name email" })
    .sort({ createdAt: -1 });

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

  const task = await Task.findById(taskId).populate({
    path: "userId",
    select: "_id name email"
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

  const update = {};
  if (name) update.name = name;
  if (isCompleted !== undefined) update.isCompleted = isCompleted;

  const task = await Task.findByIdAndUpdate(taskId, update, { new: true }).populate({
    path: "userId",
    select: "_id name email"
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

  await Task.findByIdAndDelete(taskId);

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

  const task = await Task.findByIdAndUpdate(
    taskId,
    { isCompleted: true },
    { new: true }
  ).populate("userId");

  // Give some experience points for completing a task
  if (task && task.userId) {
    await User.findByIdAndUpdate(task.userId, { $inc: { exp: 10 } });
  }

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

  const tasks = await Task.find({
    userId,
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  })
    .populate({ path: "userId", select: "_id name email" })
    .sort({ createdAt: 1 });

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
