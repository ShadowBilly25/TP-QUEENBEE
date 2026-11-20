
import { test } from "node:test";
import assert from "node:assert/strict";

import { validate } from "../src/middlewares/validate.js";
import { ValidationError } from "../src/errors.js";

import {
  measureSchema,
  measuresQuerySchema,
  inspectionSchema,
} from "../src/validators/schemas.js";

// Exécute le middleware sans démarrer de serveur.
function run(schema, data, source = "body") {
  const req = { [source]: data };
  let middlewareError;

  validate({ [source]: schema })(req, {}, (error) => {
    middlewareError = error;
  });

  if (middlewareError) {
    throw middlewareError;
  }

  return req.validated;
}

test("refuse un poids hors de sa plage physique", () => {
  assert.throws(
    () => run(measureSchema, {
      timestamp: "2026-10-31T00:00:00Z",
      weight_kg: 500,
    }),
    ValidationError
  );
});

test("refuse plusieurs valeurs hors plage dans une même mesure", () => {
  assert.throws(
    () => run(measureSchema, {
      timestamp: "2026-10-31T00:00:00Z",
      weight_kg: 500,
      humidity_pct: 120,
    }),
    (error) => {
      assert.ok(error instanceof ValidationError);
      assert.match(error.message, /weight_kg doit être inférieur ou égal à 150/);
      assert.match(error.message, /humidity_pct doit être inférieur ou égal à 100/);
      return true;
    }
  );
});

test("refuse un poids qui n'est pas un nombre", () => {
  assert.throws(
    () => run(measureSchema, {
      timestamp: "2026-10-31T00:00:00Z",
      weight_kg: "abc",
    }),
    ValidationError
  );
});

test("signale les champs obligatoires manquants dans une mesure vide", () => {
  assert.throws(
    () => run(measureSchema, {}),
    (error) => {
      assert.ok(error instanceof ValidationError);
      assert.match(error.message, /timestamp est obligatoire/);
      assert.match(error.message, /weight_kg est obligatoire/);
      return true;
    }
  );
});

test("refuse un paramètre limit non numérique", () => {
  assert.throws(
    () => run(measuresQuerySchema, { limit: "abc" }, "query"),
    (error) => {
      assert.ok(error instanceof ValidationError);
      assert.match(error.message, /limit doit être un nombre/);
      return true;
    }
  );
});

test("applique les valeurs par défaut de la pagination", () => {
  const result = run(measuresQuerySchema, {}, "query");

  assert.equal(result.query.limit, 50);
  assert.equal(result.query.offset, 0);
});

test("refuse les champs inconnus dans une inspection", () => {
  assert.throws(
    () => run(inspectionSchema, {
      id: "550e8400-e29b-41d4-a716-446655440000",
      inspected_at: "2026-11-01T09:00:00Z",
      colony_status: "forte",
      author_id: "x",
    }),
    (error) => {
      assert.ok(error instanceof ValidationError);
      assert.match(error.message, /author_id n’est pas un champ autorisé/);
      return true;
    }
  );
});

test("refuse une inspection datée dans le futur", () => {
  assert.throws(
    () => run(inspectionSchema, {
      id: "550e8400-e29b-41d4-a716-446655440000",
      inspected_at: "2099-01-01T00:00:00Z",
      colony_status: "forte",
    }),
    (error) => {
      assert.ok(error instanceof ValidationError);
      assert.match(error.message, /inspected_at ne peut pas être dans le futur/);
      return true;
    }
  );
});
