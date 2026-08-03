import "dotenv/config";

import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { errorHandler, notFoundHandler } from "@/http/response";
import { createApiRouter } from "@/routes";

const app = express();
const port = Number(process.env.PORT || 3000);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";

app.set("trust proxy", 1);
app.use(
  cors({
    origin: frontendUrl,
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use("/api", createApiRouter());
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Express backend is running at http://localhost:${port}`);
});
