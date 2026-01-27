// packages/app/src/api/core-domain/infra/auth/config.ts

import {
  type ProConnectProfile,
  ProConnectProvider,
} from "@api/core-domain/infra/auth/ProConnectProvider";
import {
  companiesUtils,
  type Company,
} from "@api/core-domain/infra/companies-store";
import { entrepriseService } from "@api/core-domain/infra/services";
import {
  type Etablissement,
  type Entreprise,
} from "@api/core-domain/infra/services/IEntrepriseService";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { Siret } from "@common/core-domain/domain/valueObjects/Siret";
import { logger } from "@api/utils/pino";
import { config } from "@common/config";
import { assertImpersonatedSession } from "@common/core-domain/helpers/impersonate";
import { Octokit } from "@octokit/rest";
import { Session, type AuthOptions } from "next-auth";
import { type DefaultJWT, type JWT } from "next-auth/jwt";
import { SignJWT, jwtVerify } from "jose";
import GithubProvider, { type GithubProfile } from "next-auth/providers/github";

import { egaproNextAuthAdapter } from "./EgaproNextAuthAdapter";

// === DÉCLARATIONS DE TYPES ===
declare module "next-auth" {
  interface Session {
    staff: {
      impersonating?: boolean;
      lastImpersonated?: Array<{ label: string | null; siren: string }>;
      lastImpersonatedHash?: string;
    };
    user: {
      entreprise?: Etablissement;
      email: string;
      firstname?: string;
      lastname?: string;
      phoneNumber?: string;
      staff: boolean;
      tokenApiV1: string;
      idToken?: string;
      siret?: string; // Optionnel, pour debug
      siren?: string;
      lastImpersonated?: Array<{ label: string | null; siren: string }>;
    };
  }

  interface Profile extends ProConnectProfile {
    entreprise?: Entreprise;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT, Session {
    email: string;
  }
}

// === URLs CHARON ===
const charonGithubUrl = new URL("github/", config.api.security.auth.charonUrl);

// === PROCONNECT PROVIDER (déjà enrichi avec Weez) ===
export const proConnectProvider = ProConnectProvider({
  clientId: config.proconnect.clientId,
  clientSecret: config.proconnect.clientSecret,
});

// === CONFIGURATION NEXTAUTH ===
export const authConfig: AuthOptions = {
  // DEBUG: Log providers to diagnose proconnect OAuth 404
  logger: {
    error: (code, ...message) => {
      logger.error({ ...message, code }, "NextAuth Error");
      console.error("NextAuth ERROR:", code, ...message); // Also to stdout
    },
    warn: (code, ...message) =>
      logger.warn({ ...message, code }, "NextAuth Warning"),
    info: (code: string, ...message: string[]) =>
      logger.info({ ...message, code }, "NextAuth Info"),
    debug: (code, ...message) => {
      logger.debug({ ...message, code }, "NextAuth Debug");
      if (config.env === "dev")
        console.log("NextAuth DEBUG:", code, ...message);
    },
  },
  logger: {
    error: (code, ...message) => logger.error({ ...message, code }, "Error"),
    warn: (code, ...message) => logger.warn({ ...message, code }, "Warning"),
    info: (code: string, ...message: string[]) =>
      logger.info({ ...message, code }, "Info"),
    debug: (code, ...message) => {
      if (config.env === "dev") logger.info({ ...message, code }, "Debug");
      else logger.debug({ ...message, code }, "Debug");
    },
  },
  secret: config.api.security.auth.secret,
  pages: {
    signIn: "/login",
    error: "/error?source=login",
    signOut: "/api/auth/proconnect-logout",
  },
  debug: config.env === "dev",
  adapter: egaproNextAuthAdapter,
  session: {
    strategy: "jwt",
    maxAge: config.env === "dev" ? 24 * 60 * 60 * 7 : 24 * 60 * 60,
  },
  providers: [
    GithubProvider({
      ...config.api.security.github,
      ...(config.env !== "prod"
        ? {
            authorization: {
              url: new URL("login/oauth/authorize", charonGithubUrl).toString(),
              params: { scope: "user:email read:user read:org" },
            },
            token: new URL(
              "login/oauth/access_token",
              charonGithubUrl,
            ).toString(),
          }
        : {
            authorization: {
              params: { scope: "user:email read:user read:org" },
            },
          }),
    }),
    proConnectProvider,
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "github") return true;

      const githubProfile = profile as unknown as GithubProfile;
      if (!account.access_token || !githubProfile?.login) return false;

      const octokit = new Octokit({ auth: account.access_token });
      try {
        const membership = await octokit.teams.getMembershipForUserInOrg({
          org: "SocialGouv",
          team_slug: "egapro",
          username: githubProfile.login,
        });
        return membership.data.state === "active";
      } catch {
        return false;
      }
    },

    async jwt({ token, profile, trigger, account, session }) {
      const isStaff = token.user?.staff || token.staff?.impersonating || false;

      // Store ID token for logout (available during initial sign in)
      if (account?.id_token) {
        token.idToken = account.id_token;
      }

      // === IMPERSONATION ===
      if (trigger === "update" && session && isStaff) {
        if (session.staff.impersonating === true) {
          assertImpersonatedSession(session);
          token.user.staff = session.user.staff;
          token.staff.impersonating = true;
          if (session.user.companies) {
            token.staff.lastImpersonatedHash =
              await companiesUtils.hashCompanies(
                session.user.companies as Company[],
              );
          }
        } else if (session.staff.impersonating === false) {
          token.user.staff = true;
          token.staff.impersonating = false;
        }
      }

      if (trigger !== "signUp") return token;

      // === INITIALISATION COMPLÈTE ===
      token.user = {
        company: undefined,
        email: token.email,
        staff: false,
        tokenApiV1: "",
        firstname: undefined,
        lastname: undefined,
        phoneNumber: undefined,
      } as Session["user"];

      token.staff = {
        impersonating: false,
        lastImpersonatedHash: "",
      } as Session["staff"];

      // === GITHUB ===
      if (account?.provider === "github") {
        const githubProfile = profile as unknown as GithubProfile;
        token.user.staff = true;
        const [firstname, lastname] = githubProfile.name?.split(" ") ?? [];
        token.user.firstname = firstname || undefined;
        token.user.lastname = lastname || undefined;
      } else {
        const proConnectProfile = profile as ProConnectProfile;
        logger.info(
          { proConnectProfile },
          "ProConnect profile reçu → enrichissement Weez",
        );

        if (proConnectProfile.siret) {
          try {
            const etablissement = await entrepriseService.siret(
              new Siret(proConnectProfile.siret),
            );
            token.user.entreprise = etablissement;
          } catch (error) {
            logger.warn(
              { siret: proConnectProfile.siret, error },
              "Failed to fetch organization for siret",
            );
          }
        }

        token.user.staff = config.api.staff.includes(
          proConnectProfile.email ?? "",
        );
        token.user.firstname = proConnectProfile.given_name ?? undefined;
        token.user.lastname = proConnectProfile.usual_name ?? undefined;
        token.user.phoneNumber = proConnectProfile.phone_number ?? undefined;
        token.user.siret = proConnectProfile.siret ?? undefined;
      }
      return token;
    },

    async redirect({ url, baseUrl }) {
      if (url.includes("/api/v2/logout")) return url;
      return url.startsWith("/") ? new URL(url, baseUrl).toString() : url;
    },

    async session({ session, token }) {
      session.user = JSON.parse(JSON.stringify(token.user));
      session.user.email = token.email;
      session.user.idToken = token.idToken as string;
      session.user.siret = token.user.siret;
      session.user.siren = token.user.entreprise?.siren;
      session.user.entreprise = token.user.entreprise;
      return session;
    },
  },

  jwt: {
    async encode({ token, secret, maxAge }) {
      const secretAsKey = new TextEncoder().encode(secret as string);
      const jwt = new SignJWT(token ?? {})
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt();
      if (maxAge) jwt.setExpirationTime(Math.floor(Date.now() / 1000) + maxAge);
      return await jwt.sign(secretAsKey);
    },
    async decode({ token, secret }) {
      try {
        const secretAsKey = new TextEncoder().encode(secret as string);
        const { payload } = await jwtVerify(token as string, secretAsKey, {
          algorithms: ["HS256"],
        });
        return payload as JWT;
      } catch (error) {
        logger.error({ error }, "Erreur décodage token");
        return null;
      }
    },
  },
};
