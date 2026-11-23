
import { test } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";

import { createAuthService } from "../src/services/auth.service.js";
import { UnauthorizedError } from "../src/errors.js";

const auth = {
  accessSecret: "test-access-secret-queenbee-32-characters",
  refreshSecret: "test-refresh-secret-queenbee-32-characters",
  accessTtl: "15m",
  refreshTtl: "7d",
  maxFailedLogins: 5,
  lockMinutes: 15,
};

async function creerFixture() {
  const password_hash = await bcrypt.hash("motdepasse-correct-123", 10);

  const utilisateur = {
    id: "user-123",
    email: "apiculteur@test.fr",
    password_hash,
    role: "apiculteur",
    site_id: "SN-CASA",
    failed_attempts: 0,
    locked_until: null,
    created_at: new Date(),
  };

  const users = [utilisateur];

  const usersRepository = {
    async findByEmail(email) {
      return users.find((user) => user.email === email) ?? null;
    },

    async findById(id) {
      const user = users.find((item) => item.id === id);
      if (!user) return null;

      const { password_hash, failed_attempts, locked_until, ...publicUser } = user;
      return publicUser;
    },

    async create(data) {
      const user = {
        id: `user-${users.length + 1}`,
        ...data,
        created_at: new Date(),
      };

      users.push(user);

      const { password_hash, ...publicUser } = user;
      return publicUser;
    },

    async resetFailedLogins(id) {
      const user = users.find((item) => item.id === id);
      user.failed_attempts = 0;
      user.locked_until = null;
    },

    async recordFailedLogin(id, maxFailed, lockMinutes) {
      const user = users.find((item) => item.id === id);
      user.failed_attempts += 1;

      if (user.failed_attempts >= maxFailed) {
        user.failed_attempts = 0;
        user.locked_until = new Date(
          Date.now() + lockMinutes * 60 * 1000,
        );

        return user.locked_until;
      }

      return null;
    },
  };

  return {
    users,
    usersRepository,
    service: createAuthService({ usersRepository, auth }),
  };
}

test("connexion réussie : retourne un utilisateur et deux tokens", async () => {
  const { service } = await creerFixture();

  const result = await service.login(
    "apiculteur@test.fr",
    "motdepasse-correct-123",
  );

  assert.equal(result.user.id, "user-123");
  assert.equal(result.user.role, "apiculteur");
  assert.equal(result.token_type, "Bearer");
  assert.ok(result.access_token);
  assert.ok(result.refresh_token);
  assert.equal("password_hash" in result.user, false);
});

test("refuse un mot de passe incorrect", async () => {
  const { service } = await creerFixture();

  await assert.rejects(
    service.login("apiculteur@test.fr", "mauvais-mot-de-passe"),
    (error) => {
      assert.ok(error instanceof UnauthorizedError);
      assert.equal(
        error.message,
        "Adresse e-mail ou mot de passe incorrect.",
      );
      return true;
    },
  );
});

test("refuse une adresse e-mail inconnue avec le même message", async () => {
  const { service } = await creerFixture();

  await assert.rejects(
    service.login("inconnu@test.fr", "mauvais-mot-de-passe"),
    (error) => {
      assert.ok(error instanceof UnauthorizedError);
      assert.equal(
        error.message,
        "Adresse e-mail ou mot de passe incorrect.",
      );
      return true;
    },
  );
});

test("vérifie un access token valide", async () => {
  const { service } = await creerFixture();

  const result = await service.login(
    "apiculteur@test.fr",
    "motdepasse-correct-123",
  );

  const user = await service.verifyAccessToken(result.access_token);

  assert.equal(user.id, "user-123");
  assert.equal(user.role, "apiculteur");
});

test("refuse un access token invalide", async () => {
  const { service } = await creerFixture();

  await assert.rejects(
    service.verifyAccessToken("token-invalide"),
    UnauthorizedError,
  );
});

test("le refresh récupère le rôle actualisé depuis le repository", async () => {
  const { service, users } = await creerFixture();

  const connexion = await service.login(
    "apiculteur@test.fr",
    "motdepasse-correct-123",
  );

  // Le rôle change dans la base de données.
  users[0].role = "coordinateur";

  const renouvellement = await service.refresh(connexion.refresh_token);

  assert.equal(renouvellement.user.role, "coordinateur");

  const user = await service.verifyAccessToken(
    renouvellement.access_token,
  );

  assert.equal(user.role, "coordinateur");
});

test("un compte est verrouillé après cinq tentatives échouées", async () => {
  const { service } = await creerFixture();

  for (let tentative = 1; tentative <= 5; tentative += 1) {
    await assert.rejects(
      service.login("apiculteur@test.fr", "mauvais-mot-de-passe"),
      UnauthorizedError,
    );
  }

  // Même avec le bon mot de passe, le compte reste verrouillé.
  await assert.rejects(
    service.login(
      "apiculteur@test.fr",
      "motdepasse-correct-123",
    ),
    (error) => {
      assert.ok(error instanceof UnauthorizedError);
      assert.match(error.message, /verrouillé/);
      return true;
    },
  );
});

test("l'inscription ne retourne jamais le hash du mot de passe", async () => {
  const { service } = await creerFixture();

  const user = await service.register({
    email: "nouveau@test.fr",
    password: "motdepasse-nouveau-123",
    role: "apiculteur",
    site_id: "SN-CASA",
  });

  assert.equal(user.email, "nouveau@test.fr");
  assert.equal(user.role, "apiculteur");
  assert.equal("password_hash" in user, false);
});
