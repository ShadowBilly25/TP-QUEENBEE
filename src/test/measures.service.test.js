import { test } from "node:test";
import assert from "node:assert/strict";

import { createMeasuresService } from "../services/measures.service.js";
import { ValidationError } from "../errors.js";

test("refuse un poids hors de sa plage physique", async () => {

  // 1. Préparer
  const savedMeasures = [];

  const hivesService = {
    getHiveById(id) {
      if (id !== "SN-CASA-001") {
        throw new Error("Ruche inconnue");
      }

      return {
        id: "SN-CASA-001",
        site_id: "SN-CASA",
      };
    },
  };

  const measuresRepository = {
    create(measure) {
      savedMeasures.push(measure);
      return measure;
    },

    findByHiveId() {
      return savedMeasures;
    },
  };

  const measuresService = createMeasuresService({
    hivesService,
    measuresRepository,
  });

  // 2. Agir
  const invalidMeasure = {
    timestamp: "2026-10-31T10:00:00Z",
    weight_kg: 500,
  };

  // 3. Vérifier
  await assert.rejects(
    async () => {
      measuresService.addMeasure(
        "SN-CASA-001",
        invalidMeasure
      );
    },
    ValidationError
  );

  assert.equal(savedMeasures.length, 0);
});