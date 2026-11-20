// Du plus récent au plus ancien. Le tri est stable : à date égale, l'ordre d'arrivée est conservé,
// donc une page ne répète jamais une ligne de la page précédente.
const parDateDecroissante = (a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp);

export function createMeasuresRepository() {
  const mesures = [];

  return {
    async add(mesure) {
      mesures.push(mesure);
      return mesure;
    },

    async findByHive(hiveId, { limit, offset }) {
      return mesures
        .filter((m) => m.hive_id === hiveId)
        .sort(parDateDecroissante)
        .slice(offset, offset + limit);
    },
  };
}
