import { ensureEnvVar as baseEnsureEnvVar } from "@common/utils/os";

import { isTruthy } from "./utils/string";

const ensureEnvVar = baseEnsureEnvVar<ProcessEnvCustomKeys>;
const ensureApiEnvVar: typeof ensureEnvVar = (key, defaultValue) => {
  if (typeof window === "undefined") {
    return ensureEnvVar(key, defaultValue);
  }
  return "";
};

export const config = {
  api_url: process.env.NEXT_PUBLIC_API_URL ?? "",
  matomo: {
    url: process.env.NEXT_PUBLIC_MATOMO_URL ?? "",
    siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID ?? "",
  },
  api: {
    maildev: {
      smtpPort: +ensureApiEnvVar("MAILER_SMTP_PORT", "1025"),
    },
    postgres: {
      host: ensureApiEnvVar("POSTGRES_HOST"),
      user: ensureApiEnvVar("POSTGRES_USER"),
      password: ensureApiEnvVar("POSTGRES_PASSWORD"),
      db: ensureApiEnvVar("POSTGRES_DB"),
      port: +ensureApiEnvVar("POSTGRES_PORT", "-1"),
      ssl: isTruthy(ensureApiEnvVar("POSTGRES_SSL", "0")),
      poolMinSize: +ensureApiEnvVar("POSTGRES_POOL_MIN_SIZE", "2"),
      poolMaxSize: +ensureApiEnvVar("POSTGRES_POOL_MAX_SIZE", "10"),
    },
  },
} as const;

interface ServicesConfig {
  db: "knex-pg" | "mock" | "postgres" | "prisma";
}

export const services: ServicesConfig = {
  db: "postgres",
};
