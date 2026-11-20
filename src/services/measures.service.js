import { ValidationError } from "../errors.js";
import { lireEntier, estDateIso } from "../utils/validation.js";

// Plages physiques retenues pour le module (UC-CY02). Champs du § 6.5 du cahier des charges.
export const PLAGES_PHYSIQUES = {
  position_lat: { min: -90, max: 90 },
  position_lon: { min: -180, max: 180 },
  weight_kg: { min: 0, max: 150 },
  temp_internal_c: { min: -10, max: 60 },
  temp_external_c: { min: -20, max: 60 },
  humidity_pct: { min: 0, max: 100 },
  acoustic_activity_score: { min: 0, max: 1 },
  battery_pct: { min: 0, max: 100 },
};

export function createMeasuresService({ hivesService, measuresRepository }) {
  return {
    async add(hiveId, corps) {
      const ruche = await hivesService.getById(hiveId);

      if (!corps || typeof corps !== "object" || Array.isArray(corps)) {
        throw new ValidationError("Le corps de la requête doit être un objet JSON (en-tête Content-Type: application/json).");
      }
      if (!estDateIso(corps.timestamp)) {
        throw new ValidationError("Le champ timestamp est obligatoire et doit être une date ISO 8601, par exemple 2026-10-31T10:00:00Z.");
      }
      if (typeof corps.weight_kg !== "number" || !Number.isFinite(corps.weight_kg)) {
        throw new ValidationError("Le champ weight_kg est obligatoire et doit être un nombre.");
      }
      // Si la trame contient un hive_id, il doit être celui du chemin.
      if (corps.hive_id !== undefined && corps.hive_id !== ruche.id) {
        throw new ValidationError(`Le champ hive_id (${corps.hive_id}) diffère de la ruche du chemin (${ruche.id}).`);
      }
      // Chaque champ présent doit être un nombre dans sa plage physique.
      for (const [champ, { min, max }] of Object.entries(PLAGES_PHYSIQUES)) {
        const valeur = corps[champ];
        if (valeur === undefined) continue;
        if (typeof valeur !== "number" || !Number.isFinite(valeur) || valeur < min || valeur > max) {
          throw new ValidationError(`Le champ ${champ} doit être un nombre compris entre ${min} et ${max}.`);
        }
      }

      // On garde le timestamp de la trame : c'est l'instant de la prise de mesure par le capteur.
      const mesure = { ...corps, hive_id: ruche.id, site_id: ruche.site_id };
      return measuresRepository.add(mesure);
    },

    // limit et offset arrivent tels que la requête les a donnés (texte) : les bornes sont une règle de l'API.
    async list(hiveId, { limit, offset }) {
      const ruche = await hivesService.getById(hiveId);

      const limite = lireEntier(limit, { defaut: 50, min: 1, max: 500 });
      if (limite === null) {
        throw new ValidationError("Le paramètre limit doit être un entier compris entre 1 et 500.");
      }
      const decalage = lireEntier(offset, { defaut: 0, min: 0 });
      if (decalage === null) {
        throw new ValidationError("Le paramètre offset doit être un entier positif ou nul.");
      }

      const items = await measuresRepository.findByHive(ruche.id, { limit: limite, offset: decalage });
      return { items, limit: limite, offset: decalage };
    },
  };
}
