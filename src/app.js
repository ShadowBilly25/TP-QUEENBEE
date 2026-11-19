import express from "express";
import { requestLogger } from "./middleware/requestLogger.js";
import hivesRouter from "./routes/hives.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(requestLogger);
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/hives", hivesRouter);

// Toujours en dernier, après toutes les routes : d'abord la route inconnue, puis le filet d'erreurs.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
