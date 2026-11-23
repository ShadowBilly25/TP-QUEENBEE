
import { Router } from "express";

import { validate } from "../../middlewares/validate.js";
import { requireRole } from "../../middlewares/auth.js";

import {
  hiveParamsSchema,
  listHivesQuerySchema,
  measureSchema,
  measuresQuerySchema,
  inspectionSchema,
} from "../../validators/schemas.js";

export function createHivesRouter(controller, { requireAuth }) {
  const router = Router();

  // Toutes les routes de ruches nécessitent un token valide.
  router.use(requireAuth);

  router.get(
    "/",
    validate({ query: listHivesQuerySchema }),
    controller.list,
  );

  router.get(
    "/:id",
    validate({ params: hiveParamsSchema }),
    controller.getOne,
  );

  router.post(
    "/:id/measures",
    requireRole("admin"),
    validate({ params: hiveParamsSchema, body: measureSchema }),
    controller.addMeasure,
  );

  router.get(
    "/:id/measures",
    validate({ params: hiveParamsSchema, query: measuresQuerySchema }),
    controller.listMeasures,
  );

  router.get(
    "/:id/inspections",
    validate({ params: hiveParamsSchema }),
    controller.listInspections,
  );

  router.post(
    "/:id/inspections",
    requireRole("apiculteur", "coordinateur"),
    validate({ params: hiveParamsSchema, body: inspectionSchema }),
    controller.addInspection,
  );

  return router;
}
