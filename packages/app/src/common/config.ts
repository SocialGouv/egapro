export type FeatureFlag = keyof typeof config.ff;

export const config = {
  /** in seconds */
  get searchRevalidate() {
    return this.env === "dev" ? 1 : 60 * 5;
  },
  get nonce() {
    return this.githubSha;
  },
  githubSha: process.env.NEXT_PUBLIC_GITHUB_SHA || "<githubSha>",
  api_url: process.env.NEXT_PUBLIC_API_URL || "/api",
  get host() {
    try {
      return new URL(this.apiv2_url).origin;
    } catch (e) {
      // Fallback pour les URLs relatives
      return typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    }
  },
  get apiv2_url() {
    return process.env.NEXT_PUBLIC_API_V2_URL || `${this.api_url}v2`;
  },
  get base_declaration_url() {
    return "/index-egapro/declaration";
  },
  get base_repeq_url() {
    return "/representation-equilibree";
  },
  matomo: {
    url: process.env.NEXT_PUBLIC_MATOMO_URL || "",
    siteId: process.env.NEXT_PUBLIC_MATOMO_SITE_ID || "",
  },
  sentry: {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
    url: process.env.SENTRY_URL || "",
    org: process.env.SENTRY_ORG || "",
    project: process.env.SENTRY_PROJECT || "",
    authToken: process.env.SENTRY_AUTH_TOKEN || "",
    release: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_GITHUB_SHA || "dev",
  },
  env: process.env.NEXT_PUBLIC_EGAPRO_ENV || "dev",
  get ff() {
    return {
      // apiV2: {
      //   enabled: this.env === "dev",
      //   whitelist: ["/apiv2/ownership", "/apiv2/health", "/apiv2/admin", "/apiv2/declaration", "/api/auth"],
      // },
    };
  },
  proconnect: {
    signinUrl: process.env.EGAPRO_PROCONNECT_SIGN_IN_URL || "",
    manageOrganisationUrl: process.env.EGAPRO_PROCONNECT_MANAGE_ORGANISATIONS_URL || "",
  },
  api: {
    staff: process.env.EGAPRO_STAFF || "",
    mailer: {
      enable: process.env.MAILER_ENABLE || false,
      host: process.env.MAILER_SMTP_HOST || "127.0.0.1",
      smtp: {
        port: process.env.MAILER_SMTP_PORT || 1025,
        password: process.env.MAILER_SMTP_PASSWORD || "",
        login: process.env.MAILER_SMTP_LOGIN || "",
        ssl: process.env.MAILER_SMTP_SSL || false,
      },
      from: process.env.MAILER_FROM_EMAIL || "EgaPro <index@travail.gouv.fr>",
      signature: process.env.MAILER_EMAIL_SIGNATURE || "L’équipe Egapro",
    },
    security: {
      jwtv1: {
        secret: process.env.SECURITY_JWT_SECRET || "secret",
        algorithm: process.env.SECURITY_JWT_ALGORITHM || "algo",
      },
      moncomptepro: {
        clientId: process.env.SECURITY_MONCOMPTEPRO_CLIENT_ID || "",
        clientSecret: process.env.SECURITY_MONCOMPTEPRO_CLIENT_SECRET || "",
        appTest: process.env.SECURITY_MONCOMPTEPRO_TEST || "",
      },
      github: {
        clientId: process.env.SECURITY_GITHUB_CLIENT_ID || "",
        clientSecret: process.env.SECURITY_GITHUB_CLIENT_SECRET || "",
      },
    },
    postgres: {
      host: process.env.POSTGRES_HOST || "",
      user: process.env.POSTGRES_USER || "",
      password: process.env.POSTGRES_PASSWORD || "",
      db: process.env.POSTGRES_DB || "egapro",
      port: process.env.POSTGRES_PORT || -1,
      ssl: process.env.POSTGRES_SSLMODE || "prefer",
      poolMinSize: process.env.POSTGRES_POOL_MIN_SIZE || 2,
      poolMaxSize: process.env.POSTGRES_POOL_MAX_SIZE || 10,
    },
  },
} as const;

interface ServicesConfig {
  apiEntreprise: "api.gouv" | "data.gouv" | "fabrique";
  db: "mock" | "postgres" | "prisma";
  jsxPdf: "react-pdf";
  mailer: "nodemailer";
}

export const services: ServicesConfig = {
  db: "postgres",
  mailer: "nodemailer",
  apiEntreprise: "fabrique",
  jsxPdf: "react-pdf",
};
