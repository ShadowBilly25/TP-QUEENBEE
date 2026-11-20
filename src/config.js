const ENVIRONNEMENTS = ["development", "production", "test"];
const STOCKAGES = ["postgres", "memory"];

// Lit un entier dans l'environnement. Absent : valeur par défaut. Présent mais invalide : erreur claire.
function lireEntier(env, nom, defaut, { min, max }) {
  const brut = env[nom] ?? String(defaut);
  const n = Number(brut);
  if (!/^\d+$/.test(brut) || n < min || n > max) {
    throw new Error(`${nom} invalide : "${brut}". Attendu : un entier entre ${min} et ${max} (par exemple ${nom}=${defaut}).`);
  }
  return n;
}

// Lit la configuration dans l'environnement (variables du système, ou fichier .env chargé par --env-file).
// Une valeur invalide lève une erreur au message clair.
export function loadConfig(env = process.env) {
  const port = lireEntier(env, "PORT", 3000, { min: 1, max: 65535 });

  const nodeEnv = env.NODE_ENV ?? "development";
  if (!ENVIRONNEMENTS.includes(nodeEnv)) {
    throw new Error(`NODE_ENV invalide : "${nodeEnv}". Valeurs possibles : ${ENVIRONNEMENTS.join(", ")}.`);
  }

  const storage = env.STORAGE ?? "postgres";
  if (!STOCKAGES.includes(storage)) {
    throw new Error(`STORAGE invalide : "${storage}". Valeurs possibles : ${STOCKAGES.join(", ")}.`);
  }

  const db = {
    host: env.DB_HOST ?? "localhost",
    port: lireEntier(env, "DB_PORT", 5432, { min: 1, max: 65535 }),
    user: env.DB_USER ?? "queenbee",
    // Aucune valeur par défaut pour un mot de passe.
    password: env.DB_PASSWORD ?? "",
    database: env.DB_NAME ?? "queenbee",
    poolMax: lireEntier(env, "DB_POOL_MAX", 10, { min: 1, max: 100 }),
  };

  if (storage === "postgres" && db.password === "") {
    throw new Error("DB_PASSWORD est obligatoire quand STORAGE=postgres (renseignez-le dans .env).");
  }

  return { port, nodeEnv, storage, db };
}

// La configuration utilisée par l'application, lue une seule fois au démarrage.
// En cas d'erreur, on affiche le message seul (pas de pile d'exécution) et on arrête le démarrage.
function chargerOuQuitter() {
  try {
    return loadConfig();
  } catch (err) {
    console.error(`Configuration invalide : ${err.message}`);
    process.exit(1);
  }
}

export const config = chargerOuQuitter();
