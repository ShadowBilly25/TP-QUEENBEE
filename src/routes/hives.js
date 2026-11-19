import { Router } from "express";
import { hives, measures } from "../data/hives.js";

// Monté sur /api/hives dans app.js : les chemins ci-dessous sont donc relatifs.
const router = Router();

// GET /api/hives et GET /api/hives?site_id=SN-CASA
router.get("/", (req, res) => {
  const { site_id } = req.query;
  const resultat = site_id ? hives.filter((h) => h.site_id === site_id) : hives;
  res.json(resultat);
});

// GET /api/hives/:id
router.get("/:id", (req, res) => {
  const ruche = hives.find((h) => h.id === req.params.id);
  if (!ruche) {
    return res.status(404).json({ error: `Ruche inconnue : ${req.params.id}` });
  }
  res.json(ruche);
});

// POST /api/hives/:id/measures
router.post("/:id/measures", (req, res) => {
  const ruche = hives.find((h) => h.id === req.params.id);
  if (!ruche) {
    return res.status(404).json({ error: `Ruche inconnue : ${req.params.id}` });
  }

  const corps = req.body ?? {};

  if (!corps.timestamp || typeof corps.weight_kg !== "number" || !Number.isFinite(corps.weight_kg)) {
    return res.status(400).json({ error: "timestamp et weight_kg (nombre) sont obligatoires" });
  }

  if (corps.hive_id !== undefined && corps.hive_id !== ruche.id) {
    return res
      .status(400)
      .json({ error: `hive_id (${corps.hive_id}) différent de la ruche du chemin (${ruche.id})` });
  }

  const mesure = { ...corps, hive_id: ruche.id, site_id: ruche.site_id };
  measures.push(mesure);
  res.status(201).json(mesure);
});

export default router;