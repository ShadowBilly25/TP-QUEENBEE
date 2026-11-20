
import { Router } from "express";

import { validate } from "../../middlewares/validate.js";

import {
  hiveParamsSchema,
  listHivesQuerySchema,
  measureSchema,
  measuresQuerySchema,
  inspectionSchema,
} from "../../validators/schemas.js";

// Routeur : quelle URL, quel verbe, quels intergiciels ? Aucune logique.
// Monté sur /api/hives dans app.js : les chemins sont donc relatifs.
export function createHivesRouter(controller) {
  const router = Router();

  // Liste des ruches
  router.get(
    "/",
    validate({ query: listHivesQuerySchema }),
    controller.list
  );

  // Détail d'une ruche
  router.get(
    "/:id",
    validate({ params: hiveParamsSchema }),
    controller.getOne
  );

  // Ajouter une mesure
  router.post(
    "/:id/measures",
    validate({ params: hiveParamsSchema, body: measureSchema }),
    controller.addMeasure
  );

  // Consulter les mesures
  router.get(
    "/:id/measures",
    validate({ params: hiveParamsSchema, query: measuresQuerySchema }),
    controller.listMeasures
  );

  // Consulter les inspections
  router.get(
    "/:id/inspections",
    validate({ params: hiveParamsSchema }),
    controller.listInspections
  );

  // Ajouter une inspection
  router.post(
    "/:id/inspections",
    validate({ params: hiveParamsSchema, body: inspectionSchema }),
    controller.addInspection
  );

  return router;
}
