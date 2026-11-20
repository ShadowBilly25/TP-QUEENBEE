export function createHivesRepository(initialHives = []) {
  const hives = [...initialHives];

  return {
    findAll({ site_id } = {}) {
      if (site_id) {
        return hives.filter(hive => hive.site_id === site_id);
      }

      return [...hives];
    },

    findById(id) {
      return hives.find(hive => hive.id === id) ?? null;
    },

    exists(id) {
      return hives.some(hive => hive.id === id);
    },
  };
}