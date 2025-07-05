import { Router } from "express";
import {
  createChallengeHistory,
  getDailyChallengeHistory,
  getChallengeHistoryById,
  updateChallengeHistory,
  deleteChallengeHistory,
  getUserChallengeHistory
} from "../controllers/challengehistory.controller.js";

const router = Router();

// Challenge History routes
router.route("/create").post(createChallengeHistory);
router.route("/daily/:dailyId").get(getDailyChallengeHistory);
router.route("/user/:userId").get(getUserChallengeHistory);
router.route("/:historyId").get(getChallengeHistoryById);
router.route("/:historyId").put(updateChallengeHistory);
router.route("/:historyId").delete(deleteChallengeHistory);

export default router;
