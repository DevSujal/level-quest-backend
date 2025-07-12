import { Router } from "express";
import {
  loginUser,
  registerUser,
  updateProfile,
  updatePassword,
  logoutUser,
  getUser,
  uploadProfilePic,
} from "../controllers/user.controllers.js";
import upload from "../middleware/multer.middleware.js";

import { validateUser } from "../middleware/user.middleware.js";
const router = Router();

router.route("/login").post(loginUser);
router
  .route("/user")
  .get(getUser)
  .post(registerUser)
  .patch(validateUser, upload.single("profilePic"), updateProfile);
// router
//   .route("/profile-pic")
//   .post(validateUser, upload.single("image"), uploadProfilePic);
router.route("/password").put(validateUser, updatePassword);
router.route("/logout").get(validateUser, logoutUser);

export default router;
