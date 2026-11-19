// Lit un paramètre de requête entier. Renvoie le nombre, ou null s'il est invalide.
// undefined (paramètre absent) donne la valeur par défaut ; une chaîne vide est invalide.
export function lireEntier(valeur, { defaut, min, max = Number.MAX_SAFE_INTEGER }) {
  if (valeur === undefined) return defaut;
  // typeof : ?limit=1&limit=2 donne un tableau côté Express, donc invalide.
  if (typeof valeur !== "string" || !/^\d+$/.test(valeur)) return null;
  const n = Number(valeur);
  return n >= min && n <= max ? n : null;
}

const DATE_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

// Date ISO 8601 avec heure et fuseau, par exemple 2026-10-31T10:00:00Z.
export function estDateIso(valeur) {
  return typeof valeur === "string" && DATE_ISO.test(valeur) && !Number.isNaN(Date.parse(valeur));
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function estUuid(valeur) {
  return typeof valeur === "string" && UUID.test(valeur);
}
