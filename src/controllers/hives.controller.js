
export function createHivesController({
  hivesService,
  measuresService,
  inspectionsService,
}) {
  return {
    // Lister les ruches
    async list(req, res) {
      const { site_id } = req.validated.query;

      const ruches = await hivesService.list({
        site_id: site_id || undefined,
      });

      res.json(ruches);
    },

    // Consulter une ruche
    async getOne(req, res) {
      const { id } = req.validated.params;

      res.json(await hivesService.getById(id));
    },

    // Ajouter une mesure
    async addMeasure(req, res) {
      const { id } = req.validated.params;
      const mesure = await measuresService.add(id, req.validated.body);

      res.status(201).json(mesure);
    },

    // Consulter les mesures
    async listMeasures(req, res) {
      const { id } = req.validated.params;
      const { limit, offset } = req.validated.query;

      const mesures = await measuresService.list(id, {
        limit,
        offset,
      });

      res.json(mesures);
    },

    // Consulter les inspections
    async listInspections(req, res) {
      const { id } = req.validated.params;

      res.json(await inspectionsService.list(id));
    },

    // Ajouter une inspection
    async addInspection(req, res) {
      const { id } = req.validated.params;
      const inspection = await inspectionsService.add(
        id,
        req.validated.body
      );

      res.status(201).json(inspection);
    },
  };
}
