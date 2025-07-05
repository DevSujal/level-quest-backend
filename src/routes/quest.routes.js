import { Router } from "express";
import {
  createQuest,
  getUserQuests,
  getQuestById,
  updateQuest,
  deleteQuest,
  completeQuest
} from "../controllers/quest.controller.js";

const router = Router();

// Quest routes
router.route("/create").post(createQuest);
router.route("/user/:userId").get(getUserQuests);
router.route("/:questId").get(getQuestById);
router.route("/:questId").put(updateQuest);
router.route("/:questId").delete(deleteQuest);
router.route("/:questId/complete").patch(completeQuest);

export default router;