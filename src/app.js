import express from "express";
import { requestLogger } from "./middleware/requestLogger.js";

const app = express();

app.use(requestLogger);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;