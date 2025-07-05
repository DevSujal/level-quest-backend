import { Router } from "express";
import {
  createTask,
  getUserTasks,
  getTaskById,
  updateTask,
  deleteTask,
  completeTask,
  getTasksByDate
} from "../controllers/task.controller.js";

const router = Router();

// Task routes
router.route("/create").post(createTask);
router.route("/user/:userId").get(getUserTasks);
router.route("/:taskId").get(getTaskById);
router.route("/:taskId").put(updateTask);
router.route("/:taskId").delete(deleteTask);
router.route("/:taskId/complete").patch(completeTask);
router.route("/date/:date/user/:userId").get(getTasksByDate);

export default router;