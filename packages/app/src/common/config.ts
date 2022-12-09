import { ensureEnvVar as baseEnsureEnvVar } from "@common/utils/os";

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
    maildev: {
      smtpPort: +ensureApiEnvVar("MAILER_SMTP_PORT", "1025"),
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
}

export const services: ServicesConfig = {
  db: "postgres",
};
