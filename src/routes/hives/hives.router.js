import { Router } from "express";

// Routeur : quelle URL, quel verbe, quels intergiciels ? Aucune logique.
// Monté sur /api/hives dans app.js : les chemins sont donc relatifs.
export function createHivesRouter(controller) {
  const router = Router();

  router.get("/", controller.list);
  router.get("/:id", controller.getOne);
  router.post("/:id/measures", controller.addMeasure);
  router.get("/:id/measures", controller.listMeasures);
  router.get("/:id/inspections", controller.listInspections);
  router.post("/:id/inspections", controller.addInspection);

  return router;
}
