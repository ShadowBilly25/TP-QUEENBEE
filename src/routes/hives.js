import { Router } from "express";
import { hives } from "../data/hives.js";

// Monté sur /api/hives dans app.js : les chemins sont relatifs.
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

export default router;