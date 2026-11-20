import express from "express";
import { requestLogger } from "./middlewares/requestLogger.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";
import { createHivesService } from "./services/hives.service.js";
import { createMeasuresService } from "./services/measures.service.js";
import { createInspectionsService } from "./services/inspections.service.js";
import { createHivesController } from "./controllers/hives.controller.js";
import { createHivesRouter } from "./routes/hives/hives.router.js";

// Crée l'application et branche les couches à partir des repositories qu'on lui passe.
// C'est le seul endroit qui connaît toutes les couches : chacune reçoit ce dont elle dépend.
export function createApp({ hivesRepository, measuresRepository, inspectionsRepository }) {
  const hivesService = createHivesService({ hivesRepository });
  const measuresService = createMeasuresService({ hivesService, measuresRepository });
  const inspectionsService = createInspectionsService({ hivesService, inspectionsRepository });
  const hivesController = createHivesController({ hivesService, measuresService, inspectionsService });

  const app = express();

  app.use(requestLogger);
  app.use(express.json());

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/hives", createHivesRouter(hivesController));

  // Toujours en dernier, après toutes les routes : d'abord la route inconnue, puis le filet d'erreurs.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
