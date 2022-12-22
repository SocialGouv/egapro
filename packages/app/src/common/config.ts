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
    staff: ensureApiEnvVar("EGAPRO_STAFF", "")
      .split(",")
      .filter(v => v),
    env: ensureApiEnvVar("EGAPRO_ENV", "dev") as "dev" | "preprod" | "prod",
    mailer: {
      enable: isTruthy(ensureApiEnvVar("MAILER_ENABLE", "false")),
      host: ensureApiEnvVar("MAILER_SMTP_HOST", "127.0.0.1"),
      smtp: {
        port: +ensureApiEnvVar("MAILER_SMTP_PORT", "1025"),
        password: ensureApiEnvVar("MAILER_SMTP_PASSWORD"),
        login: ensureApiEnvVar("MAILER_SMTP_LOGIN"),
        ssl: isTruthy(ensureApiEnvVar("MAILER_SMTP_SSL", "false")),
      },
      from: ensureApiEnvVar("MAILER_FROM_EMAIL", "EgaPro <index@travail.gouv.fr>"),
      signature: ensureApiEnvVar("MAILER_EMAIL_SIGNATURE", "L’équipe Egapro"),
    },
    security: {
      jwtv1: {
        secret: ensureApiEnvVar("SECURITY_JWT_SECRET"),
        algorithm: ensureApiEnvVar("SECURITY_JWT_ALGORITHM"),
      },
    },
    postgres: {
      host: ensureApiEnvVar("POSTGRES_HOST"),
      user: ensureApiEnvVar("POSTGRES_USER"),
      password: ensureApiEnvVar("POSTGRES_PASSWORD"),
      db: ensureApiEnvVar("POSTGRES_DB"),
      port: +ensureApiEnvVar("POSTGRES_PORT", "-1"),
      ssl: ensureApiEnvVar("POSTGRES_SSLMODE", "prefer") as "prefer" | "require",
      poolMinSize: +ensureApiEnvVar("POSTGRES_POOL_MIN_SIZE", "2"),
      poolMaxSize: +ensureApiEnvVar("POSTGRES_POOL_MAX_SIZE", "10"),
    },
  },
} as const;

interface ServicesConfig {
  db: "mock" | "postgres" | "prisma";
  mailer: "nodemailer";
}

export const services: ServicesConfig = {
  db: "postgres",
  mailer: "nodemailer",
};
