import { ensureEnvVar as baseEnsureEnvVar } from "@common/utils/os";

const ensureEnvVar = baseEnsureEnvVar<ProcessEnvCustomKeys>;
const ensureApiEnvVar: typeof ensureEnvVar = (key, defaultValue) => {
  if (typeof window === "undefined") {
    return ensureEnvVar(key, defaultValue);
  }
  return "";
};

export const config = {
  api_url: ensureEnvVar("NEXT_PUBLIC_API_URL"),
  matomo: {
    url: ensureEnvVar("NEXT_PUBLIC_MATOMO_URL", ""),
    siteId: ensureEnvVar("NEXT_PUBLIC_MATOMO_SITE_ID", ""),
  },
  api: {
    maildev: {
      smtpPort: +ensureApiEnvVar("MAILER_SMTP_PORT", "1025"),
    },
    postgres: {
      user: ensureApiEnvVar("POSTGRES_USER"),
      password: ensureApiEnvVar("POSTGRES_PASSWORD"),
      db: ensureApiEnvVar("POSTGRES_DB"),
      port: +ensureApiEnvVar("POSTGRES_PORT"),
    },
  },
} as const;

interface ServicesConfig {
  db: "postgres";
}

export const services: ServicesConfig = {
  db: "postgres",
};
