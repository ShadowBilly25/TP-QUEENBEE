
export class AppError extends Error {
  constructor(message, status = 500, title = "Internal Server Error", details = undefined) {
    super(message);

    this.name = this.constructor.name;
    this.status = status;
    this.title = title;
    this.details = details;

    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = undefined) {
    super(message, 400, "Bad Request", details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "Not Found");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict") {
    super(message, 409, "Conflict");
  }
}


export class UnauthorizedError extends AppError {
  constructor(message = "Authentification requise.") {
    super(message, 401, "Authentification requise");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Vous n'avez pas les droits nécessaires.") {
    super(message, 403, "Accès refusé");
  }
}
