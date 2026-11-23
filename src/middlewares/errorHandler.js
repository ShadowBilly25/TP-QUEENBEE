
import { AppError, NotFoundError, ConflictError } from "../errors.js";

// Gestion des routes inexistantes.
export function notFoundHandler(req, res, next) {
  next(
    new NotFoundError(
      `La route ${req.method} ${req.originalUrl} est introuvable.`,
    ),
  );
}

// Gestion centralisée des erreurs.
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // PostgreSQL : violation d'une contrainte d'unicité.
  if (err?.code === "23505") {
    err = new ConflictError("Cette ressource existe déjà.");
  }

  const isOperationalError = err instanceof AppError;

  const status = isOperationalError ? err.status : 500;
  const title = isOperationalError ? err.title : "Internal Server Error";
  const detail = isOperationalError
    ? err.message
    : "Une erreur interne est survenue.";

  // Journalisation spécifique des refus d'accès.
  if (status === 401 || status === 403) {
    console.warn(
      `[accès refusé] ${status} ${req.method} ${req.originalUrl} ip=${req.ip} utilisateur=${req.user?.id ?? "-"}`,
    );
  }

  if (!isOperationalError) {
    console.error(err);
  }

  const problem = {
    type: "about:blank",
    title,
    status,
    detail,
    instance: req.originalUrl,
  };

  if (isOperationalError && err.details !== undefined) {
    problem.errors = err.details;
  }

  const response = res
    .status(status)
    .type("application/problem+json");

  // En-tête obligatoire pour les réponses 401.
  if (status === 401) {
    response.set("WWW-Authenticate", 'Bearer realm="queenbee"');
  }

  return response.json(problem);
}
