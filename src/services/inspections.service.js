//import { randomUUID } from "node:crypto";
import { ValidationError } from "../errors.js";

const validStatuses = ["forte", "normale", "faible", "morte"];

export function createInspectionsService({
  hivesService,
  inspectionsRepository,
}) {
  function addInspection(hiveId, data) {
    hivesService.getHiveById(hiveId);

    if (
      typeof data.id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data.id)
    ) {
      throw new ValidationError("id doit être un UUID valide.");
    }

    if (
      !data.inspected_at ||
      Number.isNaN(Date.parse(data.inspected_at))
    ) {
      throw new ValidationError(
        "inspected_at doit être une date ISO 8601 valide."
      );
    }

    if (!validStatuses.includes(data.colony_status)) {
      throw new ValidationError(
        "colony_status doit être forte, normale, faible ou morte."
      );
    }

    if (
      data.queen_present !== undefined &&
      typeof data.queen_present !== "boolean"
    ) {
      throw new ValidationError(
        "queen_present doit être un booléen."
      );
    }

    if (
      data.observations !== undefined &&
      typeof data.observations !== "string"
    ) {
      throw new ValidationError(
        "observations doit être un texte."
      );
    }

    return inspectionsRepository.create({
      ...data,
      hive_id: hiveId,
    });
  }

  function getInspections(hiveId) {
    hivesService.getHiveById(hiveId);

    return inspectionsRepository.findByHiveId(hiveId);
  }

  return {
    addInspection,
    getInspections,
  };
}