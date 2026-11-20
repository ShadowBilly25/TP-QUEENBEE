
import { test } from "node:test";
import assert from "node:assert/strict";

import { createMeasuresService } from "../src/services/measures.service.js";
import { ValidationError, NotFoundError } from "../src/errors.js";

function fauxRepository() {
  const enregistrees = [];

  return {
    enregistrees,

    async add(mesure) {
      enregistrees.push(mesure);
      return mesure;
    },

    async findByHive() {
      return enregistrees;
    },
  };
}

const hivesService = {
  async getById(id) {
    if (id !== "SN-CASA-001") {
      throw new NotFoundError(
        `Aucune ruche ne porte l'identifiant ${id}.`
      );
    }

    return {
      id: "SN-CASA-001",
      site_id: "SN-CASA",
      status: "active",
    };
  },
};

const trame = (surcharge = {}) => ({
  timestamp: "2026-10-31T10:00:00Z",
  weight_kg: 36.84,
  ...surcharge,
});

test("refuse une mesure pour une ruche inconnue, sans rien enregistrer", async () => {
  const measuresRepository = fauxRepository();
  const service = createMeasuresService({
    hivesService,
    measuresRepository,
  });

  await assert.rejects(
    service.add("XX-NOPE-999", trame()),
    NotFoundError
  );

  assert.equal(measuresRepository.enregistrees.length, 0);
});

test("refuse une trame qui désigne une autre ruche que le chemin", async () => {
  const measuresRepository = fauxRepository();
  const service = createMeasuresService({
    hivesService,
    measuresRepository,
  });

  await assert.rejects(
    service.add(
      "SN-CASA-001",
      trame({ hive_id: "SN-CASA-002" })
    ),
    ValidationError
  );

  assert.equal(measuresRepository.enregistrees.length, 0);
});
