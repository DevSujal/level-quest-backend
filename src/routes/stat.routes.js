import { Router } from "express";
import {
  createStat,
  getUserStats,
  getStatById,
  updateStat,
  deleteStat,
  incrementStat,
  getUserStatBySkill
} from "../controllers/stats.controller.js";

const router = Router();

// Stat routes
router.route("/create").post(createStat);
router.route("/user/:userId").get(getUserStats);
router.route("/:statId").get(getStatById);
router.route("/:statId").put(updateStat);
router.route("/:statId").delete(deleteStat);
router.route("/:statId/increment").patch(incrementStat);
router.route("/user/:userId/skill/:skill").get(getUserStatBySkill);

export default router;
