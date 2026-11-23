
import { NotFoundError, ForbiddenError } from "../errors.js";

// Vérifie si un utilisateur peut accéder à une ruche.
export function canAccessHive(user, hive) {
  if (user.role === "admin" || user.role === "gestionnaire") {
    return true;
  }

  if (user.role === "coordinateur") {
    return user.site_id === hive.site_id;
  }

  if (user.role === "apiculteur") {
    return user.id === hive.owner_id;
  }

  return false;
}

export function createHivesService({ hivesRepository }) {
  return {
    async listHives(user, { site_id } = {}) {
      // Administrateur et gestionnaire : toutes les ruches,
      // avec un éventuel filtre par site.
      if (user.role === "admin" || user.role === "gestionnaire") {
        return hivesRepository.findAll({ site_id });
      }

      // Coordinateur : uniquement les ruches de son site.
      if (user.role === "coordinateur") {
        if (site_id && site_id !== user.site_id) {
          throw new ForbiddenError(
            "Vous ne pouvez pas consulter les ruches d'un autre site.",
          );
        }

        return hivesRepository.findAll({ site_id: user.site_id });
      }

      // Apiculteur : uniquement ses propres ruches.
      if (user.role === "apiculteur") {
        return hivesRepository.findAll({ owner_id: user.id });
      }

      throw new ForbiddenError(
        "Vous ne disposez pas des permissions nécessaires.",
      );
    },

    async getHive(user, id) {
      const ruche = await hivesRepository.findById(id);

      // On vérifie d'abord l'existence : une ruche inexistante
      // doit produire une 404, même si l'utilisateur n'y a pas accès.
      if (!ruche) {
        throw new NotFoundError(
          `Aucune ruche ne porte l'identifiant ${id}.`,
        );
      }

      if (!canAccessHive(user, ruche)) {
        throw new ForbiddenError(
          "Vous ne pouvez pas accéder à cette ruche.",
        );
      }

      return ruche;
    },
  };
}
