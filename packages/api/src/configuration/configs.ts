const asString = (
  env: typeof process.env,
  arg: string,
  defaultValue: string
): string => {
  const res = env[arg];
  if (!res) {
    return defaultValue;
  }
  return res;
};

const asNumber = (
  env: typeof process.env,
  arg: string,
  defaultValue: number
): number => {
  const res = env[arg];
  if (!res) {
    return defaultValue;
  }
  return Number.parseInt(res, 10);
};

const asBoolean = (
  env: typeof process.env,
  arg: string,
  defaultValue: boolean
): boolean => {
  const res = env[arg];
  if (!res) {
    return defaultValue;
  }
  return "true" === res ? true : false;
};

export const getConfiguration = (env: typeof process.env) => ({
  apiPort: asNumber(env, "API_PORT", 4000),

  kintoBucket: asString(env, "KINTO_BUCKET", "egapro"),
  kintoLogin: asString(env, "KINTO_LOGIN", "admin"),
  kintoPassword: asString(env, "KINTO_PASSWORD", "passw0rd"),
  kintoURL: asString(env, "KINTO_URL", "http://localhost:8888/v1"),

  mailFrom: asString(
    env,
    "MAIL_FROM",
    "Index EgaPro <contact@egapro.beta.gouv.fr>"
  ),
  mailHost: asString(env, `MAIL_HOST`, ""),
  mailPassword: asString(env, `MAIL_PASSWORD`, ""),
  mailPort: asNumber(env, `MAIL_PORT`, 465),
  mailUseTLS: asBoolean(env, `MAIL_USE_TLS`, true),
  mailUsername: asString(env, `MAIL_USERNAME`, ""),

  apiSentryDSN: asString(env, `API_SENTRY_DSN`, ""),
  apiSentryEnabled: asBoolean(env, `API_SENTRY_ENABLED`, false)
});
