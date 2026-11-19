// TP 1 — Lire les mesures sans bloquer la boucle d'événements.
//
//   GET  /ping              : elle joue « l'autre utilisateur »
//   POST /import/bloquant   : lit tout le fichier d'un coup (readFileSync)
//   POST /import/flux       : lit le fichier ligne par ligne (createReadStream + readline)
//
// Lancement, depuis la racine du projet :
//   node tp/tp1-lecture/serveur-depart.js data/mesures-SN-CASA-2026-10-31_30j.ndjson
// Puis, dans un second terminal : node tp/tp1-lecture/sonde.js bloquant (ou flux)
import express from "express";
import { existsSync, readFileSync, createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { performance } from "node:perf_hooks";

const FICHIER = process.argv[2] ?? "data/mesures-SN-CASA-2026-10-31.ndjson";

// Le chemin du fichier est relatif au dossier depuis lequel on lance la commande.
if (!existsSync(FICHIER)) {
  console.error(`Fichier introuvable : ${FICHIER}`);
  console.error("Lancez le serveur depuis la racine du projet. Pour générer le fichier de 30 jours :");
  console.error("  node scripts/generate-measures.js SN-CASA 2026-10-31 30");
  process.exit(1);
}

const app = express();

app.get("/ping", (req, res) => {
  res.json({ pong: true });
});

// Lecture bloquante : tout le fichier en mémoire, puis une boucle sans pause.
app.post("/import/bloquant", (req, res) => {
  const debut = performance.now();
  const lignes = readFileSync(FICHIER, "utf8").split("\n").filter(Boolean);
  let total = 0;
  for (const ligne of lignes) total += JSON.parse(ligne).weight_kg;
  res.json({
    mesures: lignes.length,
    poids_moyen_kg: Number((total / lignes.length).toFixed(2)),
    duree_ms: Math.round(performance.now() - debut),
  });
});

// Lecture en flux : une ligne à la fois, la boucle d'événements reprend la main entre deux morceaux.
app.post("/import/flux", async (req, res) => {
  const debut = performance.now();
  let n = 0;
  let total = 0;
  const lignes = createInterface({ input: createReadStream(FICHIER) });
  for await (const ligne of lignes) {
    if (!ligne) continue;
    total += JSON.parse(ligne).weight_kg;
    n++;
  }
  res.json({
    mesures: n,
    poids_moyen_kg: Number((total / n).toFixed(2)),
    duree_ms: Math.round(performance.now() - debut),
  });
});

app.listen(4000, () => {
  console.log(`Serveur du TP 1 sur http://localhost:4000, fichier : ${FICHIER}`);
});