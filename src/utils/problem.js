// Intitulé de chaque code : le même pour toutes les erreurs de ce code (RFC 9457, type "about:blank").
const TITRES = {
  400: "Requête invalide",
  404: "Introuvable",
  409: "Conflit",
  500: "Erreur interne",
};

// Toutes les erreurs de l'API passent par ici.
// detail décrit ce qui s'est passé pour CETTE requête ; jamais de pile d'exécution ni de message SQL.
export function sendProblem(res, status, detail) {
  res
    .status(status)
    .type("application/problem+json")
    .json({
      type: "about:blank",
      title: TITRES[status] ?? "Erreur",
      status,
      detail,
    });
}
