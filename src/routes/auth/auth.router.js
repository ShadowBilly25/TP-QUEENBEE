
import { Router } from "express";

import { validate } from "../../middlewares/validate.js";

import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from "../../validators/schemas.js";

export function createAuthRouter(controller) {
  const router = Router();

  // Créer un compte
  router.post(
    "/register",
    validate({ body: registerSchema }),
    controller.register,
  );

  // Connexion
  router.post(
    "/login",
    validate({ body: loginSchema }),
    controller.login,
  );

  // Renouvellement des tokens
  router.post(
    "/refresh",
    validate({ body: refreshSchema }),
    controller.refresh,
  );

  return router;
}
