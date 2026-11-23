
import { test } from "node:test";
import assert from "node:assert/strict";

import {
  canAccessHive,
  createHivesService,
} from "../src/services/hives.service.js";

import {
  ForbiddenError,
  NotFoundError,
} from "../src/errors.js";

const ruche = {
  id: "SN-CASA-001",
  site_id: "SN-CASA",
  owner_id: "user-apiculteur-1",
};

const admin = { id: "admin-1", role: "admin" };
const gestionnaire = { id: "gestionnaire-1", role: "gestionnaire" };

const coordinateur = {
  id: "coordinateur-1",
  role: "coordinateur",
  site_id: "SN-CASA",
};

const autreCoordinateur = {
  id: "coordinateur-2",
  role: "coordinateur",
  site_id: "SN-DAKAR",
};

const apiculteur = {
  id: "user-apiculteur-1",
  role: "apiculteur",
};

const autreApiculteur = {
  id: "user-apiculteur-2",
  role: "apiculteur",
};

test("admin et gestionnaire peuvent accéder à toutes les ruches", () => {
  assert.equal(canAccessHive(admin, ruche), true);
  assert.equal(canAccessHive(gestionnaire, ruche), true);
});

test("coordinateur : accès limité aux ruches de son site", () => {
  assert.equal(canAccessHive(coordinateur, ruche), true);
  assert.equal(canAccessHive(autreCoordinateur, ruche), false);
});

test("apiculteur : accès limité à ses propres ruches", () => {
  assert.equal(canAccessHive(apiculteur, ruche), true);
  assert.equal(canAccessHive(autreApiculteur, ruche), false);
});

test("un rôle inconnu ne peut accéder à aucune ruche", () => {
  assert.equal(
    canAccessHive({ id: "x", role: "inconnu" }, ruche),
    false,
  );
});

test("getHive renvoie 404 si la ruche n'existe pas", async () => {
  const service = createHivesService({
    hivesRepository: {
      async findById() {
        return null;
      },
    },
  });

  await assert.rejects(
    service.getHive(admin, "XX-NOPE-999"),
    NotFoundError,
  );
});

test("getHive renvoie 403 si l'utilisateur n'a pas accès", async () => {
  const service = createHivesService({
    hivesRepository: {
      async findById() {
        return ruche;
      },
    },
  });

  await assert.rejects(
    service.getHive(autreApiculteur, ruche.id),
    ForbiddenError,
  );
});

test("coordinateur ne peut pas demander un autre site", async () => {
  const service = createHivesService({
    hivesRepository: {
      async findAll() {
        return [];
      },
    },
  });

  await assert.rejects(
    service.listHives(coordinateur, { site_id: "SN-DAKAR" }),
    ForbiddenError,
  );
});
