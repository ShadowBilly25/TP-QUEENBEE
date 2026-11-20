const port = Number(process.env.PORT ?? 3000);
const nodeEnv = process.env.NODE_ENV ?? "development";

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT doit être un entier entre 1 et 65535.");
}

if (!["development", "production", "test"].includes(nodeEnv)) {
  throw new Error("NODE_ENV doit être development, production ou test.");
}

export const config = {
  port,
  nodeEnv,
};