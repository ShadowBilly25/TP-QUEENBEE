import { Router } from "express";

export function createHivesRouter(controller) {
  const router = Router();

  router.get("/", controller.getAllHives);

  router.get("/:id/measures", controller.getMeasures);

  router.post("/:id/measures", controller.addMeasure);

  router.get("/:id/inspections", controller.getInspections);

  router.post("/:id/inspections", controller.addInspection);

  router.get("/:id", controller.getHiveById);

  return router;
}