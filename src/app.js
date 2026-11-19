import express from "express";
import { requestLogger } from "./middleware/requestLogger.js";
import hivesRouter from "./routes/hives.js";

const app = express();

app.use(requestLogger);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/hives", hivesRouter);

export default app;