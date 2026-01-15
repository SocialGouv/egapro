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
  githubSha: ensureNextEnvVar(
    process.env.NEXT_PUBLIC_GITHUB_SHA,
    "<githubSha>",
  ),
  api_url: ensureNextEnvVar(process.env.NEXT_PUBLIC_API_URL, "/api"),
  get host() {
    try {
      return new URL(this.apiv2_url).origin;
    } catch (e) {
      return typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    }
  },
  get apiv2_url() {
    return ensureNextEnvVar(
      process.env.NEXT_PUBLIC_API_V2_URL,
      `${this.api_url}v2`,
    );
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
  env: ensureApiEnvVar<"dev" | "preprod" | "prod">(
    process.env.NEXT_PUBLIC_EGAPRO_ENV,
    "dev",
  ),
  get ff() {
    return {};
  },

  // PROCONNECT CONFIGURATION
  proconnect: {
    get issuer() {
      if (process.env.EGAPRO_PROCONNECT_ISSUER) {
        return process.env.EGAPRO_PROCONNECT_ISSUER;
      }
      if (process.env.EGAPRO_PROCONNECT_DISCOVERY_URL) {
        return process.env.EGAPRO_PROCONNECT_DISCOVERY_URL;
      }
      return this.env === "dev"
        ? "https://fca.integ01.dev-agentconnect.fr/api/v2"
        : "https://proconnect.gouv.fr/api/v2";
    },
    get authorization_endpoint() {
      const isKeycloak = this.issuer.includes("localhost");
      if (isKeycloak) {
        return `${this.issuer}/realms/atlas/protocol/openid-connect/auth`;
      }
      // If issuer already includes /api/v2, don't add it again
      const baseUrl = this.issuer.endsWith("/api/v2")
        ? this.issuer
        : `${this.issuer}/api/v2`;
      return `${baseUrl}/authorize`;
    },
    get token_endpoint() {
      const isKeycloak = this.issuer.includes("localhost");
      if (isKeycloak) {
        return `${this.issuer}/realms/atlas/protocol/openid-connect/token`;
      }
      // If issuer already includes /api/v2, don't add it again
      const baseUrl = this.issuer.endsWith("/api/v2")
        ? this.issuer
        : `${this.issuer}/api/v2`;
      return `${baseUrl}/token`;
    },
    get userinfo_endpoint() {
      const isKeycloak = this.issuer.includes("localhost");
      if (isKeycloak) {
        return `${this.issuer}/realms/atlas/protocol/openid-connect/userinfo`;
      }
      // If issuer already includes /api/v2, don't add it again
      const baseUrl = this.issuer.endsWith("/api/v2")
        ? this.issuer
        : `${this.issuer}/api/v2`;
      return `${baseUrl}/userinfo`;
    },
    get jwks_uri() {
      const isKeycloak = this.issuer.includes("localhost");
      if (isKeycloak) {
        return `${this.issuer}/realms/atlas/protocol/openid-connect/certs`;
      }
      return `${this.issuer}/oidc/.well-known/jwks`;
    },
    get well_known() {
      if (process.env.EGAPRO_PROCONNECT_WELL_KNOWN) {
        return process.env.EGAPRO_PROCONNECT_WELL_KNOWN;
      }
      const isKeycloak = this.issuer.includes("localhost");
      if (isKeycloak) {
        return `${this.issuer}/realms/atlas/.well-known/openid-configuration`;
      }
      return this.env !== "prod" && process.env.EGAPRO_PROCONNECT_DISCOVERY_URL
        ? `${process.env.EGAPRO_PROCONNECT_DISCOVERY_URL}/.well-known/openid-configuration`
        : `${this.issuer}/.well-known/openid-configuration`;
    },

    get clientId() {
      return ensureApiEnvVar(
        process.env.SECURITY_PROCONNECT_CLIENT_ID,
        (val) => {
          if (!val && this.env !== "dev") {
            throw new Error(
              "SECURITY_PROCONNECT_CLIENT_ID is required for non-dev environments",
            );
          }
          return val;
        },
        this.env === "dev" ? "egapro-dev" : "",
      );
    },
    get clientSecret() {
      return ensureApiEnvVar(
        process.env.SECURITY_PROCONNECT_CLIENT_SECRET,
        (val) => {
          if (!val && this.env !== "dev") {
            throw new Error(
              "SECURITY_PROCONNECT_CLIENT_SECRET is required for non-dev environments",
            );
          }
          return val;
        },
        this.env === "dev" ? "dev-secret-key-for-local-development-only" : "",
      );
    },
    callbackUrl: ensureNextEnvVar(
      process.env.NEXT_PUBLIC_PROCONNECT_CALLBACK_URL,
      `${
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000"
      }/api/auth/callback/proconnect`,
    ),
    signinUrl: ensureNextEnvVar(
      process.env.EGAPRO_PROCONNECT_SIGN_IN_URL,
      `${
        typeof window !== "undefined"
          ? window.location.origin
          : "http://localhost:3000"
      }/login`,
    ),
    manageOrganisationUrl: ensureNextEnvVar(
      process.env.EGAPRO_PROCONNECT_MANAGE_ORGANISATIONS_URL,
      "https://app.proconnect.gouv.fr/manage-organizations",
    ),
    get scope() {
      return "openid email given_name usual_name siret";
    },
  },

  api: {
    staff: ensureApiEnvVar(
      process.env.EGAPRO_STAFF,
      (envVar) => envVar.split(",").filter((v) => v),
      [],
    ),
    mailer: {
      enable: ensureApiEnvVar(process.env.MAILER_ENABLE, isTruthy, false),
      host: ensureApiEnvVar(process.env.MAILER_SMTP_HOST, "127.0.0.1"),
      smtp: {
        port: ensureApiEnvVar(process.env.MAILER_SMTP_PORT, Number, 1025),
        password: ensureApiEnvVar(process.env.MAILER_SMTP_PASSWORD, ""),
        login: ensureApiEnvVar(process.env.MAILER_SMTP_LOGIN, ""),
        ssl: ensureApiEnvVar(process.env.MAILER_SMTP_SSL, isTruthy, false),
      },
      from: ensureApiEnvVar(
        process.env.MAILER_FROM_EMAIL,
        "EgaPro <index@travail.gouv.fr>",
      ),
      signature: ensureApiEnvVar(
        process.env.MAILER_EMAIL_SIGNATURE,
        "L’équipe Egapro",
      ),
    },
    security: {
      jwtv1: {
        secret: ensureApiEnvVar(process.env.SECURITY_JWT_SECRET, "secret"),
        algorithm: ensureApiEnvVar(process.env.SECURITY_JWT_ALGORITHM, "algo"),
      },


      github: {
        clientId: ensureApiEnvVar(process.env.SECURITY_GITHUB_CLIENT_ID, ""),
        clientSecret: ensureApiEnvVar(
          process.env.SECURITY_GITHUB_CLIENT_SECRET,
          "",
        ),
      },

      auth: {
        secret: ensureApiEnvVar(process.env.SECURITY_JWT_SECRET, "secret"),
        isEmailLogin: ensureApiEnvVar(process.env.EMAIL_LOGIN, isTruthy, false),
        privateRoutes: [
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
      ssl: ensureApiEnvVar<"prefer" | "require">(
        process.env.POSTGRES_SSLMODE,
        "prefer",
      ),
      poolMinSize: ensureApiEnvVar(
        process.env.POSTGRES_POOL_MIN_SIZE,
        Number,
        2,
      ),
      poolMaxSize: ensureApiEnvVar(
        process.env.POSTGRES_POOL_MAX_SIZE,
        Number,
        10,
      ),
    },
  },
} as const;

if (typeof window !== "undefined") {
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
