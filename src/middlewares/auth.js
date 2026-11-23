
import {
  UnauthorizedError,
  ForbiddenError,
} from "../errors.js";

export function createRequireAuth(authService) {
  return async (req, res, next) => {
    try {
      const authorization = req.headers.authorization;

      if (!authorization) {
        throw new UnauthorizedError("Token d'authentification manquant.");
      }

      const match = authorization.match(/^Bearer\s+(.+)$/i);

      if (!match) {
        throw new UnauthorizedError("Format du token invalide.");
      }

      req.user = await authService.verifyAccessToken(match[1]);

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireRole(...roles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError("Authentification requise.");
      }

      if (!roles.includes(req.user.role)) {
        throw new ForbiddenError(
          "Vous ne disposez pas des permissions nécessaires.",
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
