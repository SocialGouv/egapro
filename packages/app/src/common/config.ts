import { ensureApiEnvVar, ensureNextEnvVar } from "./utils/os";
import { isTruthy } from "./utils/string";
import { type Any } from "./utils/types";

export type FeatureFlag = keyof typeof config.ff;

export const config = {
  get nonce() {
    return this.githubSha;
  },
  githubSha: ensureNextEnvVar(process.env.NEXT_PUBLIC_GITHUB_SHA, "<githubSha>"),
  api_url: ensureNextEnvVar(process.env.NEXT_PUBLIC_API_URL, "/api"),
  get host() {
    return new URL(this.api_url).origin;
  },
  get apiv2_url() {
    return ensureNextEnvVar(process.env.NEXT_PUBLIC_API_V2_URL, `${this.api_url}v2`);
  },
  matomo: {
    url: ensureNextEnvVar(process.env.NEXT_PUBLIC_MATOMO_URL, ""),
    siteId: ensureNextEnvVar(process.env.NEXT_PUBLIC_MATOMO_SITE_ID, ""),
  },
  env: ensureApiEnvVar<"dev" | "preprod" | "prod">(process.env.EGAPRO_ENV, "dev"),
  get ff() {
    return {
      "repeq-search": true,
      apiv2: {
        enabled: this.env === "dev",
        whitelist: ["/apiv2/ownership", "/apiv2/health", "/apiv2/admin", "/apiv2/declaration"],
      },
    };
  },
  api: {
    staff: ensureApiEnvVar(process.env.EGAPRO_STAFF, envVar => envVar.split(",").filter(v => v), []),
    mailer: {
      enable: ensureApiEnvVar(process.env.MAILER_ENABLE, isTruthy, false),
      host: ensureApiEnvVar(process.env.MAILER_SMTP_HOST, "127.0.0.1"),
      smtp: {
        port: ensureApiEnvVar(process.env.MAILER_SMTP_PORT, Number, 1025),
        password: ensureApiEnvVar(process.env.MAILER_SMTP_PASSWORD, ""),
        login: ensureApiEnvVar(process.env.MAILER_SMTP_LOGIN, ""),
        ssl: ensureApiEnvVar(process.env.MAILER_SMTP_SSL, isTruthy, false),
      },
      from: ensureApiEnvVar(process.env.MAILER_FROM_EMAIL, "EgaPro <index@travail.gouv.fr>"),
      signature: ensureApiEnvVar(process.env.MAILER_EMAIL_SIGNATURE, "L’équipe Egapro"),
    },
    security: {
      jwtv1: {
        secret: ensureApiEnvVar(process.env.SECURITY_JWT_SECRET, "secret"),
        algorithm: ensureApiEnvVar(process.env.SECURITY_JWT_ALGORITHM, "algo"),
      },
    },
    postgres: {
      host: ensureApiEnvVar(process.env.POSTGRES_HOST, "db"),
      user: ensureApiEnvVar(process.env.POSTGRES_USER, "postgres"),
      password: ensureApiEnvVar(process.env.POSTGRES_PASSWORD, "postgres"),
      db: ensureApiEnvVar(process.env.POSTGRES_DB, "egapro"),
      port: ensureApiEnvVar(process.env.POSTGRES_PORT, Number, -1),
      ssl: ensureApiEnvVar<"prefer" | "require">(process.env.POSTGRES_SSLMODE, "prefer"),
      poolMinSize: ensureApiEnvVar(process.env.POSTGRES_POOL_MIN_SIZE, Number, 2),
      poolMaxSize: ensureApiEnvVar(process.env.POSTGRES_POOL_MAX_SIZE, Number, 10),
    },
  },
} as const;

// TODO better debug
if (typeof window !== "undefined") {
  (window as Any)._egaproConfig = config;
}

interface ServicesConfig {
  apiEntreprise: "api.gouv" | "data.gouv" | "fabrique";
  db: "mock" | "postgres" | "prisma";
  mailer: "nodemailer";
}

export const services: ServicesConfig = {
  db: "postgres",
  mailer: "nodemailer",
  apiEntreprise: "fabrique",
};
