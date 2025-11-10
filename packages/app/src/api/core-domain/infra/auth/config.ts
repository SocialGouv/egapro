import {
  type ProConnectProfile,
  ProConnectProvider,
} from "@api/core-domain/infra/auth/ProConnectProvider";
import {
  companiesUtils,
  type Company,
} from "@api/core-domain/infra/companies-store";
import { globalMailerService } from "@api/core-domain/infra/mail";
import { ownershipRepo } from "@api/core-domain/repo";
import { SyncOwnership } from "@api/core-domain/useCases/SyncOwnership";
import { logger } from "@api/utils/pino";
import { config } from "@common/config";
import { assertImpersonatedSession } from "@common/core-domain/helpers/impersonate";
import { UnexpectedError } from "@common/shared-domain";
import { Email } from "@common/shared-domain/domain/valueObjects";
import { Octokit } from "@octokit/rest";
import jwt, { sign, verify } from "jsonwebtoken";
import { type AuthOptions, type Session } from "next-auth";
import { type DefaultJWT, type JWT } from "next-auth/jwt";
import EmailProvider from "next-auth/providers/email";
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
      companies: Array<{ label: string | null; siren: string }>;
      companiesHash: string;
      email: string;
      firstname?: string;
      lastImpersonated?: Array<{ label: string | null; siren: string }>;
      lastname?: string;
      phoneNumber?: string;
      staff: boolean;
      tokenApiV1: string;
      idToken?: string; // Add ID token for logout
    };
  }

  interface Profile extends ProConnectProfile {}
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT, Session {
    email: string;
  }
}

// === URLs CHARON (pour dev/preprod) ===
const charonMcpUrl = new URL(
  `fabriqueKeycloak/`,
  config.api.security.auth.charonUrl,
);
const charonGithubUrl = new URL("github/", config.api.security.auth.charonUrl);

// === PROCONNECT PROVIDER ===
export const proConnectProvider = ProConnectProvider({
  clientId: config.proconnect.clientId,
  clientSecret: config.proconnect.clientSecret,
});

// === CONFIGURATION NEXTAUTH ===
export const authConfig: AuthOptions = {
  logger: {
    error: (code, ...message) => logger.error({ ...message, code }, "Error"),
    warn: (code, ...message) => logger.warn({ ...message, code }, "Warning"),
    info: (code: string, ...message: string[]) =>
      logger.info({ ...message, code }, "Info"),
    debug: (code, ...message) => {
      if (config.env === "dev") {
        logger.info({ ...message, code }, "Debug");
      } else {
        logger.debug({ ...message, code }, "Debug");
      }
    },
  },
  secret: config.api.security.auth.secret,
  pages: {
    signIn: "/login",
    error: "/error?source=login",
  },
  debug: config.env === "dev",
  adapter: egaproNextAuthAdapter,
  session: {
    strategy: "jwt",
    maxAge: config.env === "dev" ? 24 * 60 * 60 * 7 : 24 * 60 * 60,
  },
  providers: [
    EmailProvider({
      async sendVerificationRequest({ identifier: to, url }) {
        await globalMailerService.init();
        const [, rejected] = await globalMailerService.sendMail(
          "login_sendVerificationUrl",
          { to },
          url,
        );
        if (rejected.length) {
          throw new UnexpectedError(
            `Cannot send verification request to email(s) : ${rejected.join(
              ", ",
            )}`,
          );
        }
      },
    }),
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
      try {
        const isStaff =
          token.user?.staff || token.staff?.impersonating || false;

        // Store ID token for logout (available during initial sign in)
        if (account?.id_token) {
          token.idToken = account.id_token;
        }

        // === IMPERSONATION ===
        if (trigger === "update" && session && isStaff) {
          if (session.staff.impersonating === true) {
            assertImpersonatedSession(session);
            token.user.staff = session.user.staff;
            token.user.companiesHash = session.user.companies
              ? await companiesUtils.hashCompanies(session.user.companies)
              : session.user.companiesHash ?? "";
            token.staff.impersonating = true;
            if (session.user.companies) {
              token.staff.lastImpersonatedHash =
                await companiesUtils.hashCompanies(
                  session.user.companies as Company[],
                );
            }
          } else if (session.staff.impersonating === false) {
            token.user.staff = true;
            token.user.companiesHash = "";
            token.staff.impersonating = false;
          }
        }

        if (trigger !== "signUp") return token;

        // === INITIALISATION COMPLÈTE ===
        token.user = {
          companies: [],
          companiesHash: "",
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
          token.user.companiesHash = "";
          const [firstname, lastname] = githubProfile.name?.split(" ") ?? [];
          token.user.firstname = firstname || undefined;
          token.user.lastname = lastname || undefined;

          // === EMAIL ===
        } else if (account?.provider === "email") {
          token.user.staff = config.api.staff.includes(profile?.email ?? "");
          if (token.email && !token.user.staff) {
            const companies = await ownershipRepo.getAllSirenByEmail(
              new Email(token.email),
              token.email,
            );
            const companiesList = companies.map((siren) => ({
              label: "",
              siren,
            }));
            token.user.companiesHash =
              await companiesUtils.hashCompanies(companiesList);
          } else {
            token.user.companiesHash = "";
          }

          // === PROCONNECT ===
        } else {
          const proConnectProfile = profile as ProConnectProfile;

          type KeycloakProfile = {
            organization?: string | string[];
            siret?: string | string[];
          };

          const keycloakProfile = profile as ProConnectProfile &
            KeycloakProfile;
          let organizations: Array<{
            label?: string | null;
            siren?: string;
            siret?: string;
          }> = [];
          if (
            proConnectProfile.organizations &&
            Array.isArray(proConnectProfile.organizations)
          ) {
            organizations = proConnectProfile.organizations;
          } else if (keycloakProfile.organization || keycloakProfile.siret) {
            const org = Array.isArray(keycloakProfile.organization)
              ? keycloakProfile.organization[0]
              : keycloakProfile.organization;
            const siret = Array.isArray(keycloakProfile.siret)
              ? keycloakProfile.siret[0]
              : keycloakProfile.siret;

            organizations = [
              {
                siren:
                  typeof siret === "string" ? siret.substring(0, 9) : undefined,
                siret: typeof siret === "string" ? siret : undefined,
                label: typeof org === "string" ? org : null,
              },
            ];
          }

          const sirenList = organizations
            .filter((org) => !!org)
            .map((org) => org.siren || org.siret?.substring(0, 9))
            .filter(Boolean) as string[];

          if (proConnectProfile.email && sirenList.length > 0) {
            try {
              const useCase = new SyncOwnership(ownershipRepo);
              await useCase.execute({
                sirens: sirenList,
                email: proConnectProfile.email,
                username: proConnectProfile.email,
              });
            } catch (error) {
              logger.error({ error }, "Error while syncing ownerships");
            }
          }

          const companiesList: Company[] = organizations
            .filter((org) => !!org && (org.siren || org.siret))
            .map((org) => ({
              siren: org.siren || (org.siret ? org.siret.substring(0, 9) : ""),
              label: org.label || null,
            }))
            .filter((c) => c.siren) as Company[];

          token.user.companiesHash =
            await companiesUtils.hashCompanies(companiesList);
          token.user.staff = config.api.staff.includes(
            proConnectProfile.email ?? "",
          );
          token.user.firstname = proConnectProfile.given_name ?? undefined;
          token.user.lastname = proConnectProfile.usual_name ?? undefined;
          token.user.phoneNumber = proConnectProfile.phone_number ?? undefined;
        }

        token.user.tokenApiV1 = createTokenApiV1(token.email);

        return token;
      } catch (error) {
        logger.error({ error }, "Error while creating token");
        throw new Error("Error while creating token");
      }
    },

    async session({ session, token }) {
      session.user = JSON.parse(JSON.stringify(token.user));
      session.user.email = token.email;
      session.user.idToken = token.idToken as string; // Include ID token for logout
      session.staff = {};

      if (token.user.companiesHash) {
        try {
          const companies = await companiesUtils.getCompaniesFromRedis(
            token.user.companiesHash,
          );
          if (companies.length > 0) {
            session.user.companies = companies;
          }
        } catch (error) {
          logger.error({ error }, "Error loading companies from Redis");
        }
      }

      if (token.user.staff || token.staff.impersonating) {
        session.staff = token.staff;
        if (token.staff.lastImpersonatedHash) {
          try {
            const lastImpersonated = await companiesUtils.getCompaniesFromRedis(
              token.staff.lastImpersonatedHash,
            );
            if (lastImpersonated.length > 0) {
              session.user.lastImpersonated = lastImpersonated;
            }
          } catch (error) {
            logger.error(
              { error },
              "Error loading last impersonated companies",
            );
          }
        }
      }
      return session;
    },
  },
};

// === TOKEN API V1 (legacy) ===
const createTokenApiV1 = (email: string) => {
  return jwt.sign({ sub: email }, config.api.security.jwtv1.secret, {
    algorithm: config.api.security.jwtv1.algorithm as jwt.Algorithm,
    expiresIn: "24h",
  });
};
