import express from "express";
import { requestLogger } from "./middleware/requestLogger.js";
import hivesRouter from "./routes/hives.js";

const app = express();

app.use(requestLogger);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/hives", hivesRouter);

// JSON invalide : 400 au lieu d'une page d'erreur HTML.
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON invalide" });
  }
  next(err);
});

export default app;