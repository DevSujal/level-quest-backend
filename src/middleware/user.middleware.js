import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

const validateUser = asyncHandler(async (req, _, next) => {
  // we know typically athorization will look like
  // Authorization: Bearer <token>
  // thats why we are spliting it taking taking the 2nd position which is token
  const accessToken =
    req.cookies?.accessToken || req.header("Authorization")?.split(" ")[1];

  if (!accessToken) {
    throw new ApiError(401, "unauthorized access");
  }

  const decodedAccessToken = jwt.verify(
    accessToken,
    process.env.ACCESS_TOKEN_SECRET
  );

  const user = await User.findById(decodedAccessToken?.userId);

  if (!user) {
    throw new ApiError(401, "invalid access token");
  }

  const userObj = user.toObject();
  delete userObj.password;

  req.user = userObj;

  next();
});

export { validateUser };
