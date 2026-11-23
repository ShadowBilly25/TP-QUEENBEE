
import {
  AppError,
  ConflictError,
  ValidationError,
  NotFoundError,
} from "../errors.js";
import { estDateIso, estUuid } from "../utils/validation.js";

const STATUTS_COLONIE = ["forte", "normale", "faible", "morte"];

function construireInspection(user, ruche, corps) {
  if (!corps || typeof corps !== "object" || Array.isArray(corps)) {
    throw new ValidationError("Le corps de la requête doit être un objet JSON.");
  }

  if (!estUuid(corps.id)) {
    throw new ValidationError("Le champ id est obligatoire et doit être un UUID.");
  }

  if (!estDateIso(corps.inspected_at)) {
    throw new ValidationError("Le champ inspected_at doit être une date ISO 8601 valide.");
  }

  if (!STATUTS_COLONIE.includes(corps.colony_status)) {
    throw new ValidationError(
      `Le champ colony_status doit valoir : ${STATUTS_COLONIE.join(", ")}.`
    );
  }

  if (
    corps.queen_present !== undefined &&
    typeof corps.queen_present !== "boolean"
  ) {
    throw new ValidationError("Le champ queen_present doit être un booléen.");
  }

  if (
    corps.observations !== undefined &&
    typeof corps.observations !== "string"
  ) {
    throw new ValidationError("Le champ observations doit être un texte.");
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

  return inspection;
}

export function createInspectionsService({
  hivesService,
  inspectionsRepository,
}) {
  return {
    async list(user, hiveId) {
      const ruche = await hivesService.getHive(user, hiveId);
      return inspectionsRepository.findByHive(ruche.id);
    },

    async add(user, hiveId, corps) {
      const ruche = await hivesService.getHive(user, hiveId);
      const inspection = construireInspection(user, ruche, corps);

      const resultat = await inspectionsRepository.insertIfAbsent(inspection);

      if (!resultat.inspection) {
        throw new Error("Impossible de retrouver l'inspection après insertion.");
      }

      if (resultat.inspection.hive_id !== ruche.id) {
        throw new ConflictError(
          `L'identifiant ${corps.id} est déjà utilisé par une autre ruche.`
        );
      }

      return resultat;
    },

    async syncInspections(user, items) {
      const resume = {
        created: 0,
        unchanged: 0,
        updated: 0,
        conflict: 0,
        rejected: 0,
      };

      const results = [];

      for (const item of items) {
        try {
          const ruche = await hivesService.getHive(user, item.hive_id);
          const inspection = construireInspection(user, ruche, item);

          const existante = await inspectionsRepository.findById(inspection.id);

          // Sans version : création ou absence de modification.
          if (item.version === undefined) {
            if (existante) {
              if (existante.hive_id !== ruche.id) {
                throw new ConflictError(
                  `L'identifiant ${inspection.id} est déjà utilisé par une autre ruche.`
                );
              }

              resume.unchanged++;
              results.push({
                id: inspection.id,
                status: "unchanged",
                inspection: existante,
              });
              continue;
            }

            const insertion = await inspectionsRepository.insertIfAbsent(inspection);

            if (!insertion.inspection) {
              throw new Error("Impossible de retrouver l'inspection après insertion.");
            }

            if (insertion.inspection.hive_id !== ruche.id) {
              throw new ConflictError(
                `L'identifiant ${inspection.id} est déjà utilisé par une autre ruche.`
              );
            }

            if (insertion.created) {
              resume.created++;
              results.push({
                id: inspection.id,
                status: "created",
                inspection: insertion.inspection,
              });
            } else {
              resume.unchanged++;
              results.push({
                id: inspection.id,
                status: "unchanged",
                inspection: insertion.inspection,
              });
            }

            continue;
          }

          // Avec une version : mise à jour optimiste.
          if (!existante) {
            throw new NotFoundError(
              `L'inspection ${inspection.id} à mettre à jour n'existe pas.`
            );
          }

          if (existante.hive_id !== ruche.id) {
            throw new ConflictError(
              `L'identifiant ${inspection.id} est déjà utilisé par une autre ruche.`
            );
          }

          // Le serveur conserve sa version : aucune écriture n'est effectuée.
          if (item.version !== existante.version) {
            resume.conflict++;
            results.push({
              id: inspection.id,
              status: "conflict",
              message: "Version obsolète : la version du serveur est prioritaire.",
              current: existante,
            });
            continue;
          }

          const miseAJour = await inspectionsRepository.updateIfVersion(
            inspection,
            item.version,
          );

          if (!miseAJour) {
            const actuelle = await inspectionsRepository.findById(inspection.id);

            resume.conflict++;
            results.push({
              id: inspection.id,
              status: "conflict",
              message: "L'inspection a été modifiée simultanément sur le serveur.",
              current: actuelle,
            });
            continue;
          }

          resume.updated++;
          results.push({
            id: inspection.id,
            status: "updated",
            inspection: miseAJour,
          });
        } catch (error) {
          if (!(error instanceof AppError)) {
            throw error;
          }

          resume.rejected++;
          results.push({
            id: item?.id,
            status: "rejected",
            message: error.message,
            details: error.details,
          });
        }
      }

      return {
        ...resume,
        results,
      };
    },
  };
}
