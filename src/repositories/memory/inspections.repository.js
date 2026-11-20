export function createInspectionsRepository(initialInspections = []) {
  const inspections = [...initialInspections];

  return {
    findByHiveId(hiveId) {
      return inspections.filter(
        inspection => inspection.hive_id === hiveId
      );
    },

    create(inspection) {
      inspections.push(inspection);
      return inspection;
    },
  };
}