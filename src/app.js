import express from "express";

import { createHivesRouter } from "./routes/hives/hives.router.js";
import { createHivesController } from "./controllers/hives.controller.js";

import { createHivesService } from "./services/hives.service.js";
import { createMeasuresService } from "./services/measures.service.js";
import { createInspectionsService } from "./services/inspections.service.js";

import { requestLogger } from "./middleware/requestLogger.js";
import {
  notFoundHandler,
  errorHandler,
} from "./middlewares/errorHandler.js";

export function createApp({
  hivesRepository,
  measuresRepository,
  inspectionsRepository,
}) {
  const app = express();

  // Middlewares
  app.use(express.json());
  app.use(requestLogger);

  // Services
  const hivesService = createHivesService({
    hivesRepository,
  });

  const measuresService = createMeasuresService({
    hivesService,
    measuresRepository,
  });

  const inspectionsService = createInspectionsService({
    hivesService,
    inspectionsRepository,
  });

  // Controller
  const hivesController = createHivesController({
    hivesService,
    measuresService,
    inspectionsService,
  });

  // Routes
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use("/api/hives", createHivesRouter(hivesController));

  // Gestion des erreurs : toujours à la fin
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}