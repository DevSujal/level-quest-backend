import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import prisma from "../../prismaClient.js";
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
      userId: user.id,
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
      userId: user.id,
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
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new ApiError(400, "user not existed");
    }

    const refreshToken = generateRefreshToken(user);
    const accessToken = generateAccessToken(user);

    await prisma.user.update({
      where: { id },
      data: { refreshToken },
    });

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

  // console.log(email, password)

  if (!email || !password) {
    throw new ApiError(400, "email and password is required to login");
  }
  // await is most important because database may be in different quantinent hence
  // it needs time to fetch the user hence we have to wait
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (!existingUser) {
    throw new ApiError(404, "user not found with the given email", [
      { field: "email" },
    ]);
  }

  // to match the password is correct or not
  const isMatched = await bcrypt.compare(password, existingUser.password);

  if (!isMatched) {
    throw new ApiError(401, "password is incorrect", [{ field: "password" }]);
  }

  const { refreshToken, accessToken } = await generateRefreshAndAccessToken(
    existingUser.id
  );

  if (!refreshToken || !accessToken) {
    throw new ApiError(500, "internal server error", [
      { field: "refreshToken" },
    ]);
  }

  delete existingUser.password;
  delete existingUser.refreshToken;

  // console.log(existingUser, accessToken, refreshToken);
  res
    .status(200)
    .cookie("accessToken", accessToken, OPTION)
    .cookie("refreshToken", refreshToken, OPTION)
    .json(new ApiResponse(200, existingUser, "user loggedin successfully"));
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

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new ApiError(409, "user with email already existed");
  }
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  delete newUser.password;
  delete newUser.refreshToken;

  res.json(new ApiResponse(201, newUser, "user created successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "uauthorized request refresh token is not present");
  }

  // jwt.verify will return an object which has userid, email, and name
  //  with expiry date of refresh token
  const decodedRefreshToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  if (!decodedRefreshToken || !decodedRefreshToken.userId) {
    throw new ApiError(401, "unauthorized request invalid refresh token");
  }
  // finding the user based on userId we have added the userId at jwt refresh token
  // so it is to find the user
  const user = await prisma.user.findUnique({
    where: {
      id: decodedRefreshToken.userId
    },
  });

  if (!user) {
    throw new ApiError(404, "Invalid refresh token");
  }

  if (user?.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "invalid refresh token");
  }

  const { accessToken, refreshToken } = await generateRefreshAndAccessToken(
    user.id
  );

  if (!refreshToken || !accessToken) {
    throw new ApiError(500, "internal server error", [
      { field: "refreshToken" },
    ]);
  }

  // password should not go with the user data at the frontend
  delete user.password;
  delete user.refreshToken;

  res
    .cookie("refreshToken", refreshToken, OPTION)
    .cookie("accessToken", accessToken, OPTION)
    .json(new ApiResponse(200, user, "new refresh and access token created"));
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  const user = await prisma.user.update({
    where: {
      userId: req.user.userId,
    },
    data: {
      name: name || req.user.name,
      email: email || req.user.email,
    },
  });

  if (!user) {
    throw new ApiError(500, "something went wrong while updating user profile");
  }

  delete user.password;
  delete user.refreshToken;

  res.json(new ApiResponse(200, user, "profile updated successfully"));
});

const updatePassword = asyncHandler(async (req, res) => {
  const { prevPassword, newPassword } = req.body;

  if (!prevPassword || !newPassword) {
    throw new ApiError(
      400,
      "prev password and new passoword is required to change password"
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      userId: req.user.userId,
    },
  });

  const isMatched = await bcrypt.compare(prevPassword, user.password);

  if (!isMatched) {
    throw new ApiError(401, "invalid password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  const updatedUser = await prisma.user.update({
    where: {
      userId: user.userId,
    },
    data: {
      password: hashedPassword,
    },
  });

  delete updatedUser.password;
  delete updatedUser.refreshToken;

  res.json(new ApiResponse(200, updatedUser, "password updated successfully"));
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

const getUserDetails = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.userId, 10);

  if (!userId) {
    throw new ApiError(400, "user id required");
  }

  const user = await prisma.user.findUnique({
    where: {
      userId,
    },
  });

  if (!user) {
    throw new ApiError(500, "something went wrong while finding user");
  }

  delete user.password;
  delete user.refreshToken;
  delete user.email;

  res.json(new ApiResponse(200, user, "user retrieved successfully"));
});

export {
  loginUser,
  registerUser,
  refreshAccessToken,
  updateProfile,
  updatePassword,
  logoutUser,
  getUserDetails,
};
