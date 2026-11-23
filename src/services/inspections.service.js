
import { ConflictError, ValidationError } from "../errors.js";
import { estDateIso, estUuid } from "../utils/validation.js";

const STATUTS_COLONIE = ["forte", "normale", "faible", "morte"];

export function createInspectionsService({ hivesService, inspectionsRepository }) {
  return {
    async list(user, hiveId) {
      const ruche = await hivesService.getHive(user, hiveId);
      return inspectionsRepository.findByHive(ruche.id);
    },

    async add(user, hiveId, corps) {
      const ruche = await hivesService.getHive(user, hiveId);

      if (!corps || typeof corps !== "object" || Array.isArray(corps)) {
        throw new ValidationError(
          "Le corps de la requête doit être un objet JSON (en-tête Content-Type: application/json)."
        );
      }

      if (!estUuid(corps.id)) {
        throw new ValidationError(
          "Le champ id est obligatoire et doit être un UUID."
        );
      }

      if (!estDateIso(corps.inspected_at)) {
        throw new ValidationError(
          "Le champ inspected_at est obligatoire et doit être une date ISO 8601, par exemple 2026-10-31T09:30:00Z."
        );
      }

      if (!STATUTS_COLONIE.includes(corps.colony_status)) {
        throw new ValidationError(
          `Le champ colony_status est obligatoire et doit valoir : ${STATUTS_COLONIE.join(", ")}.`
        );
      }

      if (
        corps.queen_present !== undefined &&
        typeof corps.queen_present !== "boolean"
      ) {
        throw new ValidationError(
          "Le champ queen_present doit être un booléen."
        );
      }

      if (
        corps.observations !== undefined &&
        typeof corps.observations !== "string"
      ) {
        throw new ValidationError(
          "Le champ observations doit être un texte."
        );
      }

      if (await inspectionsRepository.existsById(corps.id)) {
        throw new ConflictError(
          `Une inspection porte déjà l'identifiant ${corps.id}.`
        );
      }

      const inspection = {
        id: corps.id,
        hive_id: ruche.id,
        author_id: user.id,
        inspected_at: corps.inspected_at,
        colony_status: corps.colony_status,
      };

      if (corps.queen_present !== undefined) {
        inspection.queen_present = corps.queen_present;
      }

      if (corps.observations !== undefined) {
        inspection.observations = corps.observations;
      }

      return inspectionsRepository.add(inspection);
    },
  };
}
