import { Router } from "express";

import { validate } from "../../middlewares/validate.js";
import { requireRole } from "../../middlewares/auth.js";
import { syncInspectionsSchema } from "../../validators/schemas.js";

export function createInspectionsRouter(controller, { requireAuth }) {
  const router = Router();

  router.use(requireAuth);

  router.post(
    "/sync",
    requireRole("apiculteur", "coordinateur"),
    validate({ body: syncInspectionsSchema }),
    controller.syncInspections,
  );

  return router;
}
