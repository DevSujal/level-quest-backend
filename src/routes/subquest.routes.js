import { Router } from "express";
import {
  createSubQuest,
  getQuestSubQuests,
  getSubQuestById,
  updateSubQuest,
  deleteSubQuest,
  completeSubQuest,
  claimSubQuestRewards
} from "../controllers/subquest.controller.js";

const router = Router();

// SubQuest routes
router.route("/create").post(createSubQuest);
router.route("/quest/:questId").get(getQuestSubQuests);
router.route("/:subQuestId").get(getSubQuestById);
router.route("/:subQuestId").put(updateSubQuest);
router.route("/:subQuestId").delete(deleteSubQuest);
router.route("/:subQuestId/complete").patch(completeSubQuest);
router.route("/:subQuestId/claim").patch(claimSubQuestRewards);

export default router;
