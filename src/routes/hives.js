import { Router } from "express";
import { hives, measures, inspections } from "../data/hives.js";
import { sendProblem } from "../utils/problem.js";
import { lireEntier, estDateIso, estUuid } from "../utils/validation.js";

// Ce routeur est monté sur /api/hives dans app.js : les chemins sont donc relatifs.
const router = Router();

const STATUTS_COLONIE = ["forte", "normale", "faible", "morte"];

// Du plus récent au plus ancien. Le tri est stable : à date égale, l'ordre d'arrivée est conservé,
// ce qui garantit qu'une page ne répète jamais une ligne de la page précédente.
const parDateDecroissante = (champ) => (a, b) => Date.parse(b[champ]) - Date.parse(a[champ]);

function corpsObjet(req) {
  const corps = req.body;
  return corps && typeof corps === "object" && !Array.isArray(corps) ? corps : null;
}

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
    return sendProblem(res, 404, `Aucune ruche ne porte l'identifiant ${req.params.id}.`);
  }
  res.json(ruche);
});

// POST /api/hives/:id/measures
router.post("/:id/measures", (req, res) => {
  const ruche = hives.find((h) => h.id === req.params.id);
  if (!ruche) {
    return sendProblem(res, 404, `Aucune ruche ne porte l'identifiant ${req.params.id}.`);
  }

  const corps = corpsObjet(req);
  if (!corps) {
    return sendProblem(res, 400, "Le corps de la requête doit être un objet JSON (en-tête Content-Type: application/json).");
  }
  if (!estDateIso(corps.timestamp)) {
    return sendProblem(res, 400, "Le champ timestamp est obligatoire et doit être une date ISO 8601, par exemple 2026-10-31T10:00:00Z.");
  }
  if (typeof corps.weight_kg !== "number" || !Number.isFinite(corps.weight_kg)) {
    return sendProblem(res, 400, "Le champ weight_kg est obligatoire et doit être un nombre.");
  }
  // Si la trame contient un hive_id, il doit être celui du chemin.
  if (corps.hive_id !== undefined && corps.hive_id !== ruche.id) {
    return sendProblem(res, 400, `Le champ hive_id (${corps.hive_id}) diffère de la ruche du chemin (${ruche.id}).`);
  }

  // On garde le timestamp de la trame : c'est l'instant de la prise de mesure par le capteur.
  const mesure = { ...corps, hive_id: ruche.id, site_id: ruche.site_id };
  measures.push(mesure);
  res.status(201).json(mesure);
});

// GET /api/hives/:id/measures?limit=50&offset=0
router.get("/:id/measures", (req, res) => {
  const ruche = hives.find((h) => h.id === req.params.id);
  if (!ruche) {
    return sendProblem(res, 404, `Aucune ruche ne porte l'identifiant ${req.params.id}.`);
  }

  const limit = lireEntier(req.query.limit, { defaut: 50, min: 1, max: 500 });
  if (limit === null) {
    return sendProblem(res, 400, "Le paramètre limit doit être un entier compris entre 1 et 500.");
  }
  const offset = lireEntier(req.query.offset, { defaut: 0, min: 0 });
  if (offset === null) {
    return sendProblem(res, 400, "Le paramètre offset doit être un entier positif ou nul.");
  }

  const toutes = measures
    .filter((m) => m.hive_id === ruche.id)
    .sort(parDateDecroissante("timestamp"));

  res.json({ items: toutes.slice(offset, offset + limit), limit, offset });
});

// GET /api/hives/:id/inspections
router.get("/:id/inspections", (req, res) => {
  const ruche = hives.find((h) => h.id === req.params.id);
  if (!ruche) {
    return sendProblem(res, 404, `Aucune ruche ne porte l'identifiant ${req.params.id}.`);
  }
  const resultat = inspections
    .filter((i) => i.hive_id === ruche.id)
    .sort(parDateDecroissante("inspected_at"));
  res.json(resultat);
});

// POST /api/hives/:id/inspections
router.post("/:id/inspections", (req, res) => {
  const ruche = hives.find((h) => h.id === req.params.id);
  if (!ruche) {
    return sendProblem(res, 404, `Aucune ruche ne porte l'identifiant ${req.params.id}.`);
  }

  const corps = corpsObjet(req);
  if (!corps) {
    return sendProblem(res, 400, "Le corps de la requête doit être un objet JSON (en-tête Content-Type: application/json).");
  }
  // L'identifiant est choisi par l'application mobile, pas par le serveur.
  if (!estUuid(corps.id)) {
    return sendProblem(res, 400, "Le champ id est obligatoire et doit être un UUID.");
  }
  if (!estDateIso(corps.inspected_at)) {
    return sendProblem(res, 400, "Le champ inspected_at est obligatoire et doit être une date ISO 8601, par exemple 2026-10-31T09:30:00Z.");
  }
  if (!STATUTS_COLONIE.includes(corps.colony_status)) {
    return sendProblem(res, 400, `Le champ colony_status est obligatoire et doit valoir : ${STATUTS_COLONIE.join(", ")}.`);
  }
  if (corps.queen_present !== undefined && typeof corps.queen_present !== "boolean") {
    return sendProblem(res, 400, "Le champ queen_present doit être un booléen.");
  }
  if (corps.observations !== undefined && typeof corps.observations !== "string") {
    return sendProblem(res, 400, "Le champ observations doit être un texte.");
  }
  // Même UUID deux fois : on refuse plutôt que d'enregistrer un doublon.
  if (inspections.some((i) => i.id === corps.id)) {
    return sendProblem(res, 409, `Une inspection porte déjà l'identifiant ${corps.id}.`);
  }

  // Seuls les champs du contrat sont conservés.
  const inspection = {
    id: corps.id,
    hive_id: ruche.id,
    inspected_at: corps.inspected_at,
    colony_status: corps.colony_status,
  };
  if (corps.queen_present !== undefined) inspection.queen_present = corps.queen_present;
  if (corps.observations !== undefined) inspection.observations = corps.observations;

  inspections.push(inspection);
  res.status(201).json(inspection);
});

export default router;
