
import { test } from "node:test";
import assert from "node:assert/strict";

// Variables nécessaires au chargement initial de config.js.
process.env.DB_PASSWORD = "test-db-password";
process.env.JWT_ACCESS_SECRET = "access-secret-for-tests-123456";
process.env.JWT_REFRESH_SECRET = "refresh-secret-for-tests-654321";

const { loadConfig } = await import("../src/config.js");

const ENV_VALID = {
  DB_PASSWORD: "secret",
  JWT_ACCESS_SECRET: "access-secret-for-tests-123456",
  JWT_REFRESH_SECRET: "refresh-secret-for-tests-654321",
};

test("charge la configuration PostgreSQL et les paramètres JWT", () => {
  const config = loadConfig(ENV_VALID);

  assert.equal(config.port, 3000);
  assert.equal(config.db.poolMax, 10);
  assert.equal(config.db.password, "secret");

  assert.equal(config.auth.accessSecret, ENV_VALID.JWT_ACCESS_SECRET);
  assert.equal(config.auth.refreshSecret, ENV_VALID.JWT_REFRESH_SECRET);
  assert.equal(config.auth.accessTtl, "15m");
  assert.equal(config.auth.refreshTtl, "7d");
  assert.equal(config.auth.maxFailedLogins, 5);
  assert.equal(config.auth.lockMinutes, 15);

  assert.equal("storage" in config, false);
});

test("refuse les configurations sans mot de passe PostgreSQL", () => {
  assert.throws(
    () => loadConfig({ ...ENV_VALID, DB_PASSWORD: "" }),
    /DB_PASSWORD est obligatoire/,
  );
});

test("refuse les secrets JWT manquants", () => {
  assert.throws(
    () => loadConfig({
      DB_PASSWORD: "secret",
      JWT_REFRESH_SECRET: ENV_VALID.JWT_REFRESH_SECRET,
    }),
    /JWT_ACCESS_SECRET est obligatoire/,
  );

  assert.throws(
    () => loadConfig({
      DB_PASSWORD: "secret",
      JWT_ACCESS_SECRET: ENV_VALID.JWT_ACCESS_SECRET,
    }),
    /JWT_REFRESH_SECRET est obligatoire/,
  );
});

test("refuse deux secrets JWT identiques", () => {
  assert.throws(
    () => loadConfig({
      ...ENV_VALID,
      JWT_REFRESH_SECRET: ENV_VALID.JWT_ACCESS_SECRET,
    }),
    /doivent être différents/,
  );
});

test("refuse un environnement et des nombres invalides", () => {
  assert.throws(
    () => loadConfig({ ...ENV_VALID, NODE_ENV: "inconnu" }),
    /NODE_ENV invalide/,
  );

  assert.throws(
    () => loadConfig({ ...ENV_VALID, PORT: "abc" }),
    /PORT invalide/,
  );

  assert.throws(
    () => loadConfig({ ...ENV_VALID, DB_POOL_MAX: "0" }),
    /DB_POOL_MAX invalide/,
  );
});
