
const ENVIRONNEMENTS = ["development", "production", "test"];

// Lit un entier dans l'environnement.
// Absent : valeur par défaut. Présent mais invalide : erreur claire.
function lireEntier(env, nom, defaut, { min, max }) {
  const brut = env[nom] ?? String(defaut);
  const n = Number(brut);

  if (!/^\d+$/.test(brut) || n < min || n > max) {
    throw new Error(
      `${nom} invalide : "${brut}". Attendu : un entier entre ${min} et ${max}.`
    );
  }

  return n;
}

export function loadConfig(env = process.env) {
  const port = lireEntier(env, "PORT", 3000, {
    min: 1,
    max: 65535,
  });

  const nodeEnv = env.NODE_ENV ?? "development";

  if (!ENVIRONNEMENTS.includes(nodeEnv)) {
    throw new Error(
      `NODE_ENV invalide : "${nodeEnv}". Valeurs possibles : ${ENVIRONNEMENTS.join(", ")}.`
    );
  }

  const db = {
    host: env.DB_HOST ?? "localhost",
    port: lireEntier(env, "DB_PORT", 5432, {
      min: 1,
      max: 65535,
    }),
    user: env.DB_USER ?? "queenbee",
    password: env.DB_PASSWORD ?? "",
    database: env.DB_NAME ?? "queenbee",
    poolMax: lireEntier(env, "DB_POOL_MAX", 10, {
      min: 1,
      max: 100,
    }),
  };

  if (db.password === "") {
    throw new Error(
      "DB_PASSWORD est obligatoire (renseignez-le dans .env)."
    );
  }

  const accessSecret = env.JWT_ACCESS_SECRET;
  const refreshSecret = env.JWT_REFRESH_SECRET;

  if (!accessSecret) {
    throw new Error("JWT_ACCESS_SECRET est obligatoire.");
  }

  if (!refreshSecret) {
    throw new Error("JWT_REFRESH_SECRET est obligatoire.");
  }

  if (accessSecret === refreshSecret) {
    throw new Error(
      "JWT_ACCESS_SECRET et JWT_REFRESH_SECRET doivent être différents."
    );
  }

  const auth = {
    accessSecret,
    refreshSecret,
    accessTtl: env.JWT_ACCESS_TTL ?? "15m",
    refreshTtl: env.JWT_REFRESH_TTL ?? "7d",
    maxFailedLogins: 5,
    lockMinutes: 15,
  };

  return {
    port,
    nodeEnv,
    db,
    auth,
  };
}

function chargerOuQuitter() {
  try {
    return loadConfig();
  } catch (err) {
    console.error(`Configuration invalide : ${err.message}`);
    process.exit(1);
  }
}

export const config = chargerOuQuitter();
