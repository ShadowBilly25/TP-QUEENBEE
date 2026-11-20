export class NotFoundError extends Error {
  constructor(message = "Ressource introuvable.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(message = "Données invalides.") {
    super(message);
    this.name = "ValidationError";
  }
}