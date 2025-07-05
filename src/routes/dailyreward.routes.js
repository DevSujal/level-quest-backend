import { Router } from "express";
import {
  createDailyReward,
  getDailyChallengeRewards,
  getDailyRewardById,
  updateDailyReward,
  deleteDailyReward
} from "../controllers/dailyreward.controller.js";

const router = Router();

// Daily Reward routes
router.route("/create").post(createDailyReward);
router.route("/daily/:dailyId").get(getDailyChallengeRewards);
router.route("/:rewardId").get(getDailyRewardById);
router.route("/:rewardId").put(updateDailyReward);
router.route("/:rewardId").delete(deleteDailyReward);

export default router;
