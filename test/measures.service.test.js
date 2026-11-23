
import { test } from "node:test";
import assert from "node:assert/strict";

import { createMeasuresService } from "../src/services/measures.service.js";
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from "../src/errors.js";

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

const apiculteur = {
  id: "user-apiculteur-1",
  role: "apiculteur",
};

const autreApiculteur = {
  id: "user-apiculteur-2",
  role: "apiculteur",
};

const hivesService = {
  async getHive(user, id) {
    if (id !== "SN-CASA-001") {
      throw new NotFoundError(
        `Aucune ruche ne porte l'identifiant ${id}.`
      );
    }

    if (user.id !== "user-apiculteur-1") {
      throw new ForbiddenError(
        "Vous ne pouvez pas accéder à cette ruche."
      );
    }

    return {
      id: "SN-CASA-001",
      site_id: "SN-CASA",
      owner_id: "user-apiculteur-1",
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
    service.add(apiculteur, "XX-NOPE-999", trame()),
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
      apiculteur,
      "SN-CASA-001",
      trame({ hive_id: "SN-CASA-002" })
    ),
    ValidationError
  );

  assert.equal(measuresRepository.enregistrees.length, 0);
});

test("refuse l'ajout d'une mesure si l'utilisateur n'a pas accès à la ruche", async () => {
  const measuresRepository = fauxRepository();
  const service = createMeasuresService({
    hivesService,
    measuresRepository,
  });

  await assert.rejects(
    service.add(autreApiculteur, "SN-CASA-001", trame()),
    ForbiddenError
  );

  assert.equal(measuresRepository.enregistrees.length, 0);
});

test("refuse la consultation des mesures si l'utilisateur n'a pas accès à la ruche", async () => {
  const measuresRepository = fauxRepository();
  const service = createMeasuresService({
    hivesService,
    measuresRepository,
  });

  await assert.rejects(
    service.list(autreApiculteur, "SN-CASA-001"),
    ForbiddenError
  );
});
