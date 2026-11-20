import { NotFoundError } from "../errors.js";

// Service : la règle métier est-elle respectée ? Il ne lit jamais req, n'écrit jamais res,
// et reçoit ses dépendances au lieu d'importer un repository.
export function createHivesService({ hivesRepository }) {
  return {
    async list({ site_id } = {}) {
      return hivesRepository.findAll({ site_id });
    },

    // Utilisé aussi par les autres services : « la ruche existe-t-elle ? » se décide ici, une seule fois.
    async getById(id) {
      const ruche = await hivesRepository.findById(id);
      if (!ruche) {
        throw new NotFoundError(`Aucune ruche ne porte l'identifiant ${id}.`);
      }
      return ruche;
    },
  };
}
