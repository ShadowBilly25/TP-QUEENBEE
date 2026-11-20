import { config } from "./config.js";
import { createApp } from "./app.js";

import { createHivesRepository } from "./repositories/memory/hives.repository.js";
import { createMeasuresRepository } from "./repositories/memory/measures.repository.js";
import { createInspectionsRepository } from "./repositories/memory/inspections.repository.js";

// Données initiales de démonstration
const initialHives = [
  {
    id: "SN-CASA-001",
    site_id: "SN-CASA",
    status: "active",
  },
  {
    id: "SN-CASA-002",
    site_id: "SN-CASA",
    status: "active",
  },
  {
    id: "SN-DKR-001",
    site_id: "SN-DKR",
    status: "active",
  },
  {
    id: "SN-DKR-002",
    site_id: "SN-DKR",
    status: "inactive",
  },
];

const hivesRepository = createHivesRepository(initialHives);
const measuresRepository = createMeasuresRepository();
const inspectionsRepository = createInspectionsRepository();

// Création de l'application
const app = createApp({
  hivesRepository,
  measuresRepository,
  inspectionsRepository,
});

// Démarrage
app.listen(config.port, () => {
  console.log(`API démarrée sur http://localhost:${config.port}`);
  console.log(`Environnement : ${config.nodeEnv}`);
});