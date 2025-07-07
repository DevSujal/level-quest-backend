import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import bcrypt from "bcrypt";
import jwt, { decode } from "jsonwebtoken";

const SALT_ROUNDS = 10;

const OPTION = {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      name: user.name,
      email: user.email,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      name: user.name,
      email: user.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

const generateRefreshAndAccessToken = async (id) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      throw new ApiError(400, "user not existed");
    }
    const refreshToken = generateRefreshToken(user);
    const accessToken = generateAccessToken(user);
    user.refreshToken = refreshToken;
    await user.save();
    return { refreshToken, accessToken };
  } catch (error) {
    throw new ApiError(
      500,
      error?.message ||
        "something went wrong which generating access and refresh tokens"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new ApiError(400, "email and password is required to login");
  }
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    throw new ApiError(404, "user not found with the given email", [
      { field: "email" },
    ]);
  }
  const isMatched = await bcrypt.compare(password, existingUser.password);
  if (!isMatched) {
    throw new ApiError(401, "password is incorrect", [{ field: "password" }]);
  }
  const { refreshToken, accessToken } = await generateRefreshAndAccessToken(
    existingUser._id
  );
  if (!refreshToken || !accessToken) {
    throw new ApiError(500, "internal server error", [
      { field: "refreshToken" },
    ]);
  }
  const userObj = existingUser.toObject();
  delete userObj.password;
  delete userObj.refreshToken;
  res
    .status(200)
    .cookie("accessToken", accessToken, OPTION)
    .cookie("refreshToken", refreshToken, OPTION)
    .json(new ApiResponse(200, userObj, "user loggedin successfully"));
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if ([name, email, password].some((field) => !field || field.length == 0)) {
    throw new ApiError(
      400,
      "name, email and password are required to register"
    );
  }
  if (!email.includes("@", ".")) {
    throw new ApiError(400, "email is not valid");
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "user with email already existed");
  }
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
  });
  const userObj = newUser.toObject();
  delete userObj.password;
  delete userObj.refreshToken;
  res.json(new ApiResponse(201, userObj, "user created successfully"));
});

const getUser = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "uauthorized request refresh token is not present");
  }
  const decodedRefreshToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  if (!decodedRefreshToken || !decodedRefreshToken.userId) {
    throw new ApiError(401, "unauthorized request invalid refresh token");
  }
  const user = await User.findById(decodedRefreshToken.userId);
  if (!user) {
    throw new ApiError(404, "Invalid refresh token");
  }
  if (user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "invalid refresh token");
  }
  const { accessToken, refreshToken } = await generateRefreshAndAccessToken(
    user._id
  );
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;
  res
    .cookie("refreshToken", refreshToken, OPTION)
    .cookie("accessToken", accessToken, OPTION)
    .json(
      new ApiResponse(200, userObj, "new refresh and access token created")
    );
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.userId,
    {
      name: name || req.user.name,
      email: email || req.user.email,
    },
    { new: true }
  );
  if (!user) {
    throw new ApiError(500, "something went wrong while updating user profile");
  }
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;
  res.json(new ApiResponse(200, userObj, "profile updated successfully"));
});

const uploadProfilePic = asyncHandler(async (req, res) => {
  const path = req.file.path;

  if (!path) {
    throw new ApiError(400, "image path not found");
  }

  const userId = req.user._id;
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { profilePic: path },
    { new: true }
  ).select("-refreshToken -password");

  if (!updatedUser) {
    throw new ApiError(500, "internal server error while updating user");
  }

  return res.json(
    new ApiResponse(200, updatedUser, "user updated successfully")
  );
});

const updatePassword = asyncHandler(async (req, res) => {
  const { prevPassword, newPassword } = req.body;
  if (!prevPassword || !newPassword) {
    throw new ApiError(
      400,
      "prev password and new passoword is required to change password"
    );
  }
  const user = await User.findById(req.user._id);
  const isMatched = await bcrypt.compare(prevPassword, user.password);
  if (!isMatched) {
    throw new ApiError(401, "invalid password");
  }
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.password = hashedPassword;
  await user.save();
  const userObj = user.toObject();
  delete userObj.password;
  delete userObj.refreshToken;
  res.json(new ApiResponse(200, userObj, "password updated successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new ApiError("unauthorized access");
  }
  res
    .status(200)
    .clearCookie("accessToken", OPTION)
    .clearCookie("refreshToken", OPTION)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});

export {
  loginUser,
  registerUser,
  getUser,
  updateProfile,
  updatePassword,
  logoutUser,
  uploadProfilePic,
};
