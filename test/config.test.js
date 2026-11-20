import { test } from "node:test";
import assert from "node:assert/strict";

// config.js lit process.env dès qu'on l'importe et arrête le processus si la configuration est invalide
// (par exemple DB_PASSWORD vide avec STORAGE=postgres). On fixe donc STORAGE avant l'import : chaque
// fichier de test tourne dans son propre processus, ce changement ne touche pas les autres fichiers.
process.env.STORAGE = "memory";
const { loadConfig } = await import("../src/config.js");

test("stockage postgres par défaut, et mot de passe obligatoire sans valeur par défaut", () => {
  assert.throws(() => loadConfig({}), /DB_PASSWORD est obligatoire/);
  assert.throws(() => loadConfig({ DB_PASSWORD: "" }), /DB_PASSWORD est obligatoire/);

  const config = loadConfig({ DB_PASSWORD: "secret" });
  assert.equal(config.storage, "postgres");
  assert.equal(config.db.poolMax, 10);
  assert.equal(config.port, 3000);
});

test("le stockage en mémoire n'exige pas de mot de passe", () => {
  assert.equal(loadConfig({ STORAGE: "memory" }).storage, "memory");
});

test("refuse un STORAGE inconnu et des nombres invalides", () => {
  assert.throws(() => loadConfig({ STORAGE: "mongo" }), /STORAGE invalide/);
  assert.throws(() => loadConfig({ STORAGE: "memory", PORT: "abc" }), /PORT invalide/);
  assert.throws(() => loadConfig({ STORAGE: "memory", DB_POOL_MAX: "0" }), /DB_POOL_MAX invalide/);
});
