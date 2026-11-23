import { test } from "node:test";
import assert from "node:assert/strict";

import { createInspectionsService } from "../src/services/inspections.service.js";
import { ConflictError } from "../src/errors.js";

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  role: "apiculteur",
};

const ruche = {
  id: "SN-CASA-001",
};

const inspectionInitiale = {
  id: "22222222-2222-4222-8222-222222222222",
  hive_id: ruche.id,
  author_id: user.id,
  inspected_at: "2026-11-20T10:00:00Z",
  colony_status: "normale",
  queen_present: true,
  observations: "Inspection initiale",
};

function creerEnvironnement() {
  const inspections = new Map();

  const inspectionsRepository = {
    async findById(id) {
      return inspections.get(id) ?? null;
    },

    async insertIfAbsent(inspection) {
      const existante = inspections.get(inspection.id);

      if (existante) {
        return { inspection: existante, created: false };
      }

      const nouvelle = {
        ...inspection,
        version: 1,
        created_at: "2026-11-20T10:00:00Z",
        updated_at: "2026-11-20T10:00:00Z",
      };

      inspections.set(nouvelle.id, nouvelle);

      return { inspection: nouvelle, created: true };
    },

    async updateIfVersion(inspection, expectedVersion) {
      const existante = inspections.get(inspection.id);

      if (
        !existante ||
        existante.hive_id !== inspection.hive_id ||
        existante.version !== expectedVersion
      ) {
        return null;
      }

      const miseAJour = {
        ...existante,
        ...inspection,
        version: existante.version + 1,
        updated_at: "2026-11-23T10:00:00Z",
      };

      inspections.set(miseAJour.id, miseAJour);

      return miseAJour;
    },

    async findByHive(hiveId) {
      return [...inspections.values()].filter(
        (inspection) => inspection.hive_id === hiveId,
      );
    },
  };

  const hivesService = {
    async getHive(_user, hiveId) {
      if (hiveId !== ruche.id) {
        throw new Error("Ruche inconnue dans ce test.");
      }

      return ruche;
    },
  };

  return {
    inspections,
    service: createInspectionsService({
      hivesService,
      inspectionsRepository,
    }),
  };
}

test("crée une inspection une seule fois", async () => {
  const { service, inspections } = creerEnvironnement();

  const premier = await service.syncInspections(user, [
    { ...inspectionInitiale, hive_id: ruche.id },
  ]);

  const second = await service.syncInspections(user, [
    { ...inspectionInitiale, hive_id: ruche.id },
  ]);

  assert.equal(premier.created, 1);
  assert.equal(second.unchanged, 1);
  assert.equal(inspections.size, 1);
});

test("refuse une mise à jour avec une version obsolète", async () => {
  const { service } = creerEnvironnement();

  await service.syncInspections(user, [
    { ...inspectionInitiale, hive_id: ruche.id },
  ]);

  await service.syncInspections(user, [
    {
      ...inspectionInitiale,
      hive_id: ruche.id,
      version: 1,
      observations: "Modification acceptée",
    },
  ]);

  const resultat = await service.syncInspections(user, [
    {
      ...inspectionInitiale,
      hive_id: ruche.id,
      version: 1,
      observations: "Modification obsolète",
    },
  ]);

  assert.equal(resultat.conflict, 1);
  assert.equal(resultat.results[0].status, "conflict");
  assert.equal(resultat.results[0].current.version, 2);
  assert.equal(
    resultat.results[0].current.observations,
    "Modification acceptée",
  );
});

test("met à jour une inspection avec la bonne version", async () => {
  const { service } = creerEnvironnement();

  await service.syncInspections(user, [
    { ...inspectionInitiale, hive_id: ruche.id },
  ]);

  const resultat = await service.syncInspections(user, [
    {
      ...inspectionInitiale,
      hive_id: ruche.id,
      version: 1,
      observations: "Nouvelle observation",
    },
  ]);

  assert.equal(resultat.updated, 1);
  assert.equal(resultat.results[0].inspection.version, 2);
  assert.equal(
    resultat.results[0].inspection.observations,
    "Nouvelle observation",
  );
});
test("add refuse un identifiant déjà utilisé par une autre ruche", async () => {
  const { service, inspections } = creerEnvironnement();

  inspections.set(inspectionInitiale.id, {
    ...inspectionInitiale,
    hive_id: "SN-AUTRE-001",
  });

  await assert.rejects(
    service.add(user, "SN-CASA-001", {
      ...inspectionInitiale,
    }),
    ConflictError,
  );
});
