
import express from "express";

import { requestLogger } from "./middlewares/requestLogger.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";

import { createHivesService } from "./services/hives.service.js";
import { createMeasuresService } from "./services/measures.service.js";
import { createInspectionsService } from "./services/inspections.service.js";
import { createAuthService } from "./services/auth.service.js";

import { createHivesController } from "./controllers/hives.controller.js";
import { createAuthController } from "./controllers/auth.controller.js";

import { createHivesRouter } from "./routes/hives/hives.router.js";
import { createInspectionsRouter } from "./routes/inspections/inspections.router.js";
import { createAuthRouter } from "./routes/auth/auth.router.js";

import { createRequireAuth } from "./middlewares/auth.js";

export function createApp({
  hivesRepository,
  measuresRepository,
  inspectionsRepository,
  usersRepository,
  auth,
}) {
  const authService = createAuthService({ usersRepository, auth });
  const requireAuth = createRequireAuth(authService);

  const hivesService = createHivesService({ hivesRepository });
  const measuresService = createMeasuresService({
    hivesService,
    measuresRepository,
  });
  const inspectionsService = createInspectionsService({
    hivesService,
    inspectionsRepository,
  });

  const hivesController = createHivesController({
    hivesService,
    measuresService,
    inspectionsService,
  });

  const authController = createAuthController({ authService });

  const app = express();

  app.use(requestLogger);
  app.use(express.json());

  app.get("/health", (req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", createAuthRouter(authController));
  app.use(
    "/api/hives",
    createHivesRouter(hivesController, { requireAuth }),
  );

  app.use("/api/inspections", createInspectionsRouter(hivesController, { requireAuth }));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
