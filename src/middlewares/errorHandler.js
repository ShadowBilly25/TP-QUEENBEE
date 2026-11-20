
import { AppError, NotFoundError, ConflictError } from "../errors.js";

// Gestion des routes inexistantes
export function notFoundHandler(req, res, next) {
  next(
    new NotFoundError(
      `La route ${req.method} ${req.originalUrl} est introuvable.`
    )
  );
}

// Gestion centralisée des erreurs
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // PostgreSQL : violation d'une contrainte d'unicité
  if (err?.code === "23505") {
    err = new ConflictError("Cette ressource existe déjà.");
  }

  const isOperationalError = err instanceof AppError;

  const status = isOperationalError ? err.status : 500;
  const title = isOperationalError ? err.title : "Internal Server Error";
  const detail = isOperationalError
    ? err.message
    : "Une erreur interne est survenue.";

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

  return res
    .status(status)
    .type("application/problem+json")
    .json(problem);
}
