
import { ValidationError } from "../errors.js";

export function createMeasuresService({ hivesService, measuresRepository }) {
  return {
    async add(hiveId, corps) {
      const ruche = await hivesService.getById(hiveId);

      if (corps?.hive_id !== undefined && corps.hive_id !== ruche.id) {
        throw new ValidationError(
          `Le champ hive_id (${corps.hive_id}) diffère de la ruche du chemin (${ruche.id}).`
        );
      }

      const mesure = {
        ...corps,
        hive_id: ruche.id,
        site_id: ruche.site_id,
      };

      return measuresRepository.add(mesure);
    },

    async list(hiveId, { limit = 50, offset = 0 } = {}) {
      const ruche = await hivesService.getById(hiveId);

      const items = await measuresRepository.findByHive(ruche.id, {
        limit,
        offset,
      });

      return { items, limit, offset };
    },
  };
}
