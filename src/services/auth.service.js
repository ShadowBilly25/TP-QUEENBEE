
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import {
  UnauthorizedError,
  ConflictError,
} from "../errors.js";

const ISSUER = "queenbee-api";
const AUDIENCE = "queenbee";
const ALGORITHM = "HS256";

const INVALID_CREDENTIALS =
  "Adresse e-mail ou mot de passe incorrect.";

// Hash bcrypt utilisé pour effectuer une comparaison même
// lorsque l'adresse e-mail n'existe pas.
const DUMMY_HASH = bcrypt.hashSync("queenbee-dummy-password", 10);

export function createAuthService({ usersRepository, auth }) {
  function createAccessToken(user) {
    return jwt.sign(
      {
        type: "access",
        role: user.role,
        site_id: user.site_id,
      },
      auth.accessSecret,
      {
        subject: user.id,
        expiresIn: auth.accessTtl,
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithm: ALGORITHM,
      },
    );
  }

  function createRefreshToken(user) {
    return jwt.sign(
      {
        type: "refresh",
      },
      auth.refreshSecret,
      {
        subject: user.id,
        expiresIn: auth.refreshTtl,
        issuer: ISSUER,
        audience: AUDIENCE,
        algorithm: ALGORITHM,
      },
    );
  }

  function createTokens(user) {
    return {
      access_token: createAccessToken(user),
      refresh_token: createRefreshToken(user),
      token_type: "Bearer",
    };
  }

  function verifyToken(token, secret, expectedType) {
    try {
      const payload = jwt.verify(token, secret, {
        algorithms: [ALGORITHM],
        issuer: ISSUER,
        audience: AUDIENCE,
      });

      if (
        typeof payload === "string" ||
        payload.type !== expectedType ||
        !payload.sub
      ) {
        throw new UnauthorizedError("Token invalide.");
      }

      return payload;
    } catch {
      throw new UnauthorizedError("Token invalide ou expiré.");
    }
  }

  return {
    async login(email, password) {
      const user = await usersRepository.findByEmail(email);

      // Même opération bcrypt pour une adresse inconnue.
      const passwordMatches = await bcrypt.compare(
        password,
        user?.password_hash ?? DUMMY_HASH,
      );

      if (!user) {
        throw new UnauthorizedError(INVALID_CREDENTIALS);
      }

      // Un compte verrouillé reste inaccessible, même avec
      // le bon mot de passe.
      if (
        user.locked_until &&
        new Date(user.locked_until).getTime() > Date.now()
      ) {
        throw new UnauthorizedError(
          "Compte temporairement verrouillé. Réessayez plus tard.",
        );
      }

      if (!passwordMatches) {
        const lockedUntil = await usersRepository.recordFailedLogin(
          user.id,
          auth.maxFailedLogins,
          auth.lockMinutes,
        );

        if (lockedUntil) {
          throw new UnauthorizedError(
            "Compte temporairement verrouillé. Réessayez plus tard.",
          );
        }

        throw new UnauthorizedError(INVALID_CREDENTIALS);
      }

      await usersRepository.resetFailedLogins(user.id);

      const publicUser = {
        id: user.id,
        email: user.email,
        role: user.role,
        site_id: user.site_id,
        created_at: user.created_at,
      };

      return {
        user: publicUser,
        ...createTokens(publicUser),
      };
    },

    async refresh(refreshToken) {
      const payload = verifyToken(
        refreshToken,
        auth.refreshSecret,
        "refresh",
      );

      // Relire l'utilisateur pour prendre en compte
      // une modification récente de son rôle ou de son site.
      const user = await usersRepository.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedError("Utilisateur introuvable.");
      }

      return {
        user,
        ...createTokens(user),
      };
    },

    async register({ email, password, role, site_id }) {
      const password_hash = await bcrypt.hash(password, 10);

      try {
        const user = await usersRepository.create({
          email,
          password_hash,
          role,
          site_id,
        });

        // Le repository retourne uniquement les champs publics.
        return user;
      } catch (err) {
        if (err.code === "23505") {
          throw new ConflictError(
            "Cette adresse e-mail est déjà utilisée.",
          );
        }

        throw err;
      }
    },

    async verifyAccessToken(accessToken) {
      const payload = verifyToken(
        accessToken,
        auth.accessSecret,
        "access",
      );

      // Vérification de l'existence du compte et récupération
      // de ses droits actuels.
      const user = await usersRepository.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedError("Utilisateur introuvable.");
      }

      return user;
    },
  };
}
