// Contrôleur : que dit la requête, que répondre ? Il lit req, appelle un service, écrit res.
// Il ne contient ni règle métier ni accès aux données : il n'importe jamais un repository.
// Express 5 transmet à l'intergiciel d'erreurs toute exception ou promesse rejetée d'un gestionnaire :
// pas de try/catch ici.
export function createHivesController({ hivesService, measuresService, inspectionsService }) {
  return {
    async list(req, res) {
      // Un site_id vide équivaut à son absence.
      const ruches = await hivesService.list({ site_id: req.query.site_id || undefined });
      res.json(ruches);
    },

    async getOne(req, res) {
      res.json(await hivesService.getById(req.params.id));
    },

    async addMeasure(req, res) {
      const mesure = await measuresService.add(req.params.id, req.body);
      res.status(201).json(mesure);
    },

    async listMeasures(req, res) {
      const { limit, offset } = req.query;
      res.json(await measuresService.list(req.params.id, { limit, offset }));
    },

    async listInspections(req, res) {
      res.json(await inspectionsService.list(req.params.id));
    },

    async addInspection(req, res) {
      const inspection = await inspectionsService.add(req.params.id, req.body);
      res.status(201).json(inspection);
    },
  };
}
