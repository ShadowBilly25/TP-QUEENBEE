
export function createHivesController({
  hivesService,
  measuresService,
  inspectionsService,
}) {
  return {
    async list(req, res) {
      const { site_id } = req.validated.query;

      const ruches = await hivesService.listHives(req.user, {
        site_id: site_id || undefined,
      });

      res.json(ruches);
    },

    async getOne(req, res) {
      const { id } = req.validated.params;

      res.json(await hivesService.getHive(req.user, id));
    },

    async addMeasure(req, res) {
      const { id } = req.validated.params;

      const mesure = await measuresService.add(
        req.user,
        id,
        req.validated.body,
      );

      res.status(201).json(mesure);
    },

    async listMeasures(req, res) {
      const { id } = req.validated.params;
      const { limit, offset } = req.validated.query;

      const mesures = await measuresService.list(req.user, id, {
        limit,
        offset,
      });

      res.json(mesures);
    },

    async listInspections(req, res) {
      const { id } = req.validated.params;

      res.json(await inspectionsService.list(req.user, id));
    },

    async addInspection(req, res) {
      const { id } = req.validated.params;

      const inspection = await inspectionsService.add(
        req.user,
        id,
        req.validated.body,
      );

      res.status(201).json(inspection);
    },
  };
}
