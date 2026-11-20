// Erreurs métier. Elles ne connaissent pas HTTP : c'est l'intergiciel d'erreurs
// (middlewares/errorHandler.js) qui les traduit en codes de statut.

export class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

// Ajoutée en plus de l'énoncé : une inspection dont l'UUID existe déjà (409 depuis le TP 3).
export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConflictError";
  }
}
