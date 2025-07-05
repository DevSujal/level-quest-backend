import { Router } from "express";
import {
  createReward,
  getQuestRewards,
  getSubQuestRewards,
  getRewardById,
  updateReward,
  deleteReward
} from "../controllers/reward.controller.js";

const router = Router();

// Reward routes
router.route("/create").post(createReward);
router.route("/quest/:questId").get(getQuestRewards);
router.route("/subquest/:subQuestId").get(getSubQuestRewards);
router.route("/:rewardId").get(getRewardById);
router.route("/:rewardId").put(updateReward);
router.route("/:rewardId").delete(deleteReward);

export default router;
