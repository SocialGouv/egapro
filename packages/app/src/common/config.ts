import { ensureApiEnvVar, ensureNextEnvVar } from "./utils/os";
import { isTruthy } from "./utils/string";

export type FeatureFlag = keyof typeof config.ff;

export const config = {
  /** in seconds */
  get searchRevalidate() {
    return this.env === "dev" ? 1 : 60 * 5;
  },
  get nonce() {
    return this.githubSha;
  },
  githubSha: ensureNextEnvVar(process.env.NEXT_PUBLIC_GITHUB_SHA, "<githubSha>"),
  api_url: ensureNextEnvVar(process.env.NEXT_PUBLIC_API_URL, "/api"),
  get host() {
    try {
      return new URL(this.apiv2_url).origin;
    } catch (e) {
      // Fallback pour les URLs relatives
      return typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    }
  },
  get apiv2_url() {
    return ensureNextEnvVar(process.env.NEXT_PUBLIC_API_V2_URL, `${this.api_url}v2`);
  },
  get base_declaration_url() {
    return "/index-egapro/declaration";
  },
  get base_repeq_url() {
    return "/representation-equilibree";
  },
  matomo: {
    url: ensureNextEnvVar(process.env.NEXT_PUBLIC_MATOMO_URL, ""),
    siteId: ensureNextEnvVar(process.env.NEXT_PUBLIC_MATOMO_SITE_ID, ""),
  },
  env: ensureApiEnvVar<"dev" | "preprod" | "prod">(process.env.NEXT_PUBLIC_EGAPRO_ENV, "dev"),
  get ff() {
    return {
      // apiV2: {
      //   enabled: this.env === "dev",
      //   whitelist: ["/apiv2/ownership", "/apiv2/health", "/apiv2/admin", "/apiv2/declaration", "/api/auth"],
      // },
    };
  },
  proconnect: {
    signinUrl: ensureNextEnvVar(process.env.EGAPRO_PROCONNECT_SIGN_IN_URL, ""),
    manageOrganisationUrl: ensureNextEnvVar(process.env.EGAPRO_PROCONNECT_MANAGE_ORGANISATIONS_URL, ""),
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
      moncomptepro: {
        clientId: ensureApiEnvVar(process.env.SECURITY_MONCOMPTEPRO_CLIENT_ID, ""),
        clientSecret: ensureApiEnvVar(process.env.SECURITY_MONCOMPTEPRO_CLIENT_SECRET, ""),
        appTest: ensureApiEnvVar(process.env.SECURITY_MONCOMPTEPRO_TEST, isTruthy, false),
      },
      github: {
        clientId: ensureApiEnvVar(process.env.SECURITY_GITHUB_CLIENT_ID, ""),
        clientSecret: ensureApiEnvVar(process.env.SECURITY_GITHUB_CLIENT_SECRET, ""),
      },
      auth: {
        secret: ensureApiEnvVar(process.env.SECURITY_JWT_SECRET, "secret"),
        isEmailLogin: ensureApiEnvVar(process.env.EMAIL_LOGIN, isTruthy, false),
        privateRoutes: [
          "/mon-espace/mes-declarations",
          "/mon-espace/les-entreprises",
          "/mon-espace/mes-entreprises",
          "/index-egapro/declaration/augmentations",
          "/index-egapro/declaration/augmentations-et-promotions",
          "/index-egapro/declaration/commencer",
          "/index-egapro/declaration/conges-maternite",
          "/index-egapro/declaration/declarant",
          "/index-egapro/declaration/declaration-existante",
          "/index-egapro/declaration/entreprise",
          "/index-egapro/declaration/periode-reference",
          "/index-egapro/declaration/publication",
          "/index-egapro/declaration/remunerations",
          "/index-egapro/declaration/remunerations-coefficient-autre",
          "/index-egapro/declaration/remunerations-coefficient-branche",
          "/index-egapro/declaration/remunerations-csp",
          "/index-egapro/declaration/remunerations-resultat",
          "/index-egapro/declaration/resultat-global",
          "/index-egapro/declaration/ues",
          "/index-egapro/declaration/validation-transmission",
          "/representation-equilibree/commencer",
          "/representation-equilibree/declarant",
          "/representation-equilibree/ecarts-",
          "/representation-equilibree/entreprise",
          "/representation-equilibree/periode-reference",
          "/representation-equilibree/publication",
          "/representation-equilibree/transmission",
          "/representation-equilibree/validation",
        ],
        staffRoutes: ["/admin/liste-referents", "/admin/impersonate"],
        charonUrl: ensureApiEnvVar(
          process.env.SECURITY_CHARON_URL,
          "https://egapro-charon.ovh.fabrique.social.gouv.fr",
        ),
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

// console.log("config loaded", config);

// TODO better debug
if (typeof window !== "undefined") {
  // Warning: the config generated by the client may be different with the server.
  // Ex: for postgres, on client, there is no env var, so it will return default values.
  // You need to console.log(config) and check the server console, to see what the real config is.
  window._egaproConfig = config;
}

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
