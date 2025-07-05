import { Router } from "express";
import {
  createChallenge,
  getDailyChallenges,
  getChallengeById,
  updateChallenge,
  deleteChallenge,
  completeChallenge
} from "../controllers/challenge.controller.js";

const router = Router();

// Challenge routes
router.route("/create").post(createChallenge);
router.route("/daily/:dailyId").get(getDailyChallenges);
router.route("/:challengeId").get(getChallengeById);
router.route("/:challengeId").put(updateChallenge);
router.route("/:challengeId").delete(deleteChallenge);
router.route("/:challengeId/complete").patch(completeChallenge);

export default router;
