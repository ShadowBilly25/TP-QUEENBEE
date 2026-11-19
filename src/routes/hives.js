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

export default router;