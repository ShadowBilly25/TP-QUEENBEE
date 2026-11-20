// Repository : comment lire et écrire les données. Il ne choisit jamais un code HTTP
// et ne décide d'aucune règle métier. Ici, les données sont en mémoire.
const RUCHES_DEPART = [
  { id: "SN-CASA-001", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-002", site_id: "SN-CASA", status: "active" },
  { id: "SN-CASA-003", site_id: "SN-CASA", status: "inactive" },
  { id: "SN-DAKA-001", site_id: "SN-DAKA", status: "active" },
  { id: "SN-DAKA-002", site_id: "SN-DAKA", status: "active" },
];

export function createHivesRepository(ruches = RUCHES_DEPART) {
  return {
    async findAll({ site_id } = {}) {
      return site_id ? ruches.filter((h) => h.site_id === site_id) : [...ruches];
    },

    // Renvoie null si la ruche n'existe pas : décider que c'est une erreur 404 n'est pas son rôle.
    async findById(id) {
      return ruches.find((h) => h.id === id) ?? null;
    },
  };
}
