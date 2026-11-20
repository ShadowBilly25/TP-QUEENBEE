const parDateDecroissante = (a, b) => Date.parse(b.inspected_at) - Date.parse(a.inspected_at);

export function createInspectionsRepository() {
  const inspections = [];

  return {
    async add(inspection) {
      inspections.push(inspection);
      return inspection;
    },

    async existsById(id) {
      return inspections.some((i) => i.id === id);
    },

    async findByHive(hiveId) {
      return inspections.filter((i) => i.hive_id === hiveId).sort(parDateDecroissante);
    },
  };
}
