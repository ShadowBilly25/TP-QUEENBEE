export function createHivesController({
  hivesService,
  measuresService,
  inspectionsService,
}) {
  return {
    getAllHives(req, res) {
      const hives = hivesService.getAllHives({
        site_id: req.query.site_id || undefined,
      });

      res.status(200).json(hives);
    },

    getHiveById(req, res) {
      const hive = hivesService.getHiveById(req.params.id);

      res.status(200).json(hive);
    },

    addMeasure(req, res) {
      const measure = measuresService.addMeasure(
        req.params.id,
        req.body
      );

      res.status(201).json(measure);
    },

    getMeasures(req, res) {
      const result = measuresService.getMeasures(
        req.params.id,
        req.query
      );

      res.status(200).json(result);
    },

    getInspections(req, res) {
      const inspections = inspectionsService.getInspections(
        req.params.id
      );

      res.status(200).json(inspections);
    },

    addInspection(req, res) {
      const inspection = inspectionsService.addInspection(
        req.params.id,
        req.body
      );

      res.status(201).json(inspection);
    },
  };
}