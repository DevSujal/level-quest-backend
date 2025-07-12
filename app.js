import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

// app.use is a middleware which runs before running the acutual route
// cross browser resource sharing
// we cant make credentials = true with origin = * it is not allowed
// credentials = true means we are allowing to share credentials like cookies,
//  headers etc using cross browser
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

const LIMIT = "16kb";

// these middleware is used to parse json requests
// and limit is given so that json payloads must be in limits for the security purpose to protect urls from DOS attacks
app.use(
  express.json({
    limit: LIMIT,
  })
);

// express.urlencoded is a built in middleware in express
// which incoming requests which has url-encoded payloads ie form data
app.use(
  express.urlencoded({
    limit: LIMIT,
  })
);

//This line tells your Express app to use the cookie-parser middleware, which:
// Parses the Cookie header from incoming requests and makes cookies easily
// accessible via req.cookies.
app.use(cookieParser());

import userRouter from "./src/routes/user.routes.js";
import statRouter from "./src/routes/stat.routes.js";
import itemRouter from "./src/routes/item.routes.js";
import questRouter from "./src/routes/quest.routes.js";
import subQuestRouter from "./src/routes/subquest.routes.js";
import rewardRouter from "./src/routes/reward.routes.js";
import dailyChallengeRouter from "./src/routes/dailychallenge.routes.js";
import challengeRouter from "./src/routes/challenge.routes.js";
import taskRouter from "./src/routes/task.routes.js";
import challengeHistoryRouter from "./src/routes/challengehistory.routes.js";
import dailyRewardRouter from "./src/routes/dailyreward.routes.js";
import connect from "./src/db/db.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/stats", statRouter);
app.use("/api/v1/items", itemRouter);
app.use("/api/v1/quests", questRouter);
app.use("/api/v1/subquests", subQuestRouter);
app.use("/api/v1/rewards", rewardRouter);
app.use("/api/v1/daily-challenges", dailyChallengeRouter);
app.use("/api/v1/challenges", challengeRouter);
app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/challenge-history", challengeHistoryRouter);
app.use("/api/v1/daily-rewards", dailyRewardRouter);

// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.status || 500;
  console.log(err);
  return res.status(statusCode).json({
    ok: false,
    success: false,
    error: {
      message: err.message || "something went wrong",
      errors: err.errors || [],
    },
  });
});

const port = process.env.PORT || 8000;
// starts the application at port number 8000
connect().then(
  app.listen(port, () => {
    console.log("server running on port :", port);
  })
);
