import { Router } from "express";
import {
  createItem,
  getUserItems,
  getStoreItems,
  getItemById,
  updateItem,
  deleteItem,
  purchaseItem,
  useItem
} from "../controllers/item.controller.js";

const router = Router();

// Item routes
router.route("/create").post(createItem);
router.route("/store").get(getStoreItems);
router.route("/user/:userId").get(getUserItems);
router.route("/:itemId").get(getItemById);
router.route("/:itemId").put(updateItem);
router.route("/:itemId").delete(deleteItem);
router.route("/:itemId/purchase").post(purchaseItem);
router.route("/:itemId/use").patch(useItem);

export default router;