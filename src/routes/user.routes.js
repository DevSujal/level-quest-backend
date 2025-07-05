import { Router } from "express";
import {
  loginUser,
  registerUser,
  refreshAccessToken,
  updateProfile,
  updatePassword,
  logoutUser,
  getUserDetails,
} from "../controllers/user.controllers.js";

import { validateUser } from "../middleware/user.middleware.js";
const router = Router();

router.route("/login").post(loginUser);
router.route("/register").post(registerUser);
router.route("/refresh-access-token").post(refreshAccessToken);
router.route("/update-profile").put(validateUser, updateProfile);
router.route("/update-password").put(validateUser, updatePassword);
router.route("/logout").get(validateUser, logoutUser);
router.route("/get-user-details/:userId").get(getUserDetails);

export default router;
