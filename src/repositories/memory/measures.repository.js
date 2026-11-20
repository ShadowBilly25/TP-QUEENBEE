export function createMeasuresRepository(initialMeasures = []) {
  const measures = [...initialMeasures];

  return {
    findByHiveId(hiveId) {
      return measures
        .filter(measure => measure.hive_id === hiveId)
        .sort(
          (a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        );
    },

    create(measure) {
      measures.push(measure);
      return measure;
    },

    count() {
      return measures.length;
    },
  };
}