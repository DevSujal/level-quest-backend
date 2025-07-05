import { Router } from "express";
import {
  createDailyChallenge,
  getUserDailyChallenges,
  getDailyChallengeById,
  getTodayChallenge,
  updateDailyChallenge,
  deleteDailyChallenge,
  claimDailyRewards
} from "../controllers/dailychallenge.controller.js";

const router = Router();

// Daily Challenge routes
router.route("/create").post(createDailyChallenge);
router.route("/user/:userId").get(getUserDailyChallenges);
router.route("/today/:userId").get(getTodayChallenge);
router.route("/:dailyChallengeId").get(getDailyChallengeById);
router.route("/:dailyChallengeId").put(updateDailyChallenge);
router.route("/:dailyChallengeId").delete(deleteDailyChallenge);
router.route("/:dailyChallengeId/claim").patch(claimDailyRewards);

export default router;
