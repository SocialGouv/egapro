import { type ProConnectProfile, ProConnectProvider } from "@api/core-domain/infra/auth/ProConnectProvider";
import { companiesUtils, type Company } from "@api/core-domain/infra/companies-store";
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
      // For backward compatibility
      email: string;
      firstname?: string;
      lastImpersonated?: Array<{ label: string | null; siren: string }>;
      lastname?: string;
      phoneNumber?: string;
      staff: boolean;
      tokenApiV1: string;
    };
  }

  interface Profile extends ProConnectProfile {}
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT, Session {
    email: string;
  }
}

const charonMcpUrl = new URL(`fabriqueKeycloak/`, config.api.security.auth.charonUrl);
const charonGithubUrl = new URL("github/", config.api.security.auth.charonUrl);
export const monCompteProProvider = ProConnectProvider({
  ...config.api.security.moncomptepro,
  ...(config.env !== "prod"
    ? {
        wellKnown: new URL(`.well-known/openid-configuration`, charonMcpUrl).toString(),
      }
    : {}),
});
export const authConfig: AuthOptions = {
  jwt: {
    async encode({ token, secret }): Promise<string> {
      // Sign the token using HS256 without encrypting the payload.
      try {
        return sign(token as JWT, secret, {
          algorithm: "HS256",
        });
      } catch (error) {
        logger.error({ error }, "Error while encoding token");
        throw new Error("Error while encoding token");
      }
    },
    async decode({ token, secret }): Promise<JWT | null> {
      try {
        // Verify and decode the token using HS256.
        return verify(token as string, secret, { algorithms: ["HS256"] }) as JWT;
      } catch (error) {
        logger.error({ error }, "Error while decoding token");
        return null;
      }
    },
  },
  logger: {
    error: (code: any, ...message: any[]) => logger.error({ ...message, code }, "Error"),
    warn: (code: any, ...message: any[]) => logger.warn({ ...message, code }, "Warning"),
    info: (code: any, ...message: any[]) => logger.info({ ...message, code }, "Info"),
    debug: (code: any, ...message: any[]) => {
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
  // need a very basic adapter to consider every login as signup
  adapter: egaproNextAuthAdapter,
  // force session to be stored as jwt in cookie instead of database
  session: {
    strategy: "jwt",
    maxAge: config.env === "dev" ? 24 * 60 * 60 * 7 : 24 * 60 * 60, // 24 hours in prod and preprod, 7 days in dev
  },
  providers: [
    EmailProvider({
      async sendVerificationRequest({ identifier: to, url }) {
        await globalMailerService.init();
        const [, rejected] = await globalMailerService.sendMail("login_sendVerificationUrl", { to }, url);
        if (rejected.length) {
          throw new UnexpectedError(`Cannot send verification request to email(s) : ${rejected.join(", ")}`);
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
            token: new URL("login/oauth/access_token", charonGithubUrl).toString(),
          }
        : {
            authorization: {
              params: { scope: "user:email read:user read:org" },
            },
          }),
    }),
    monCompteProProvider,
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "github") {
        return true;
      }

      const githubProfile = profile as unknown as GithubProfile;
      if (!account.access_token || !githubProfile?.login) {
        return false;
      }

      const octokit = new Octokit({
        auth: account.access_token,
      });

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
    // prefill JWT encoded data with staff and ownership on signup
    // by design user always "signup" from our pov because we don't save user accounts
    async jwt({ token, profile, trigger, account, session }) {
      try {
        const isStaff = token.user?.staff || token.staff?.impersonating || false;

        if (trigger === "update" && session && isStaff) {
          if (session.staff.impersonating === true) {
            // staff starts impersonating
            assertImpersonatedSession(session);
            token.user.staff = session.user.staff;

            // Store companies in Redis if available
            if (session.user.companies) {
              // Create hash and store companies in Redis
              token.user.companiesHash = await companiesUtils.hashCompanies(session.user.companies);
            } else if ("companiesHash" in session.user && session.user.companiesHash) {
              // Use existing hash
              token.user.companiesHash = session.user.companiesHash as string;
            }

            token.staff.impersonating = true;

            // If impersonating, store the current companies for later
            if (session.user.companies) {
              // Create last impersonated hash and store in Redis
              const companiesList = session.user.companies as Company[];
              token.staff.lastImpersonatedHash = await companiesUtils.hashCompanies(companiesList);
            }
          } else if (session.staff.impersonating === false) {
            // staff stops impersonating
            token.user.staff = true;
            token.user.companiesHash = ""; // Empty hash for no companies
            token.staff.impersonating = false;
          }
        }
        if (trigger !== "signUp") return token;
        token.user = {
          companiesHash: "",
          email: token.email,
          staff: false,
          tokenApiV1: "",
        } as Session["user"];
        token.staff = {
          impersonating: false,
          lastImpersonatedHash: "",
        } as Session["staff"];
        if (account?.provider === "github") {
          const githubProfile = profile as unknown as GithubProfile;
          token.user.staff = true;
          token.user.companiesHash = ""; // Empty hash for no companies
          const [firstname, lastname] = githubProfile.name?.split(" ") ?? [];
          token.user.firstname = firstname;
          token.user.lastname = lastname;
        } else if (account?.provider === "email") {
          token.user.staff = config.api.staff.includes(profile?.email ?? "");
          if (token.email && !token.user.staff) {
            const companies = await ownershipRepo.getAllSirenByEmail(new Email(token.email));
            const companiesList = companies.map(siren => ({ label: "", siren }));

            // Create hash and store companies in Redis
            token.user.companiesHash = await companiesUtils.hashCompanies(companiesList);
          } else {
            token.user.companiesHash = ""; // Empty hash for no companies
          }
        } else {
          const sirenList = profile?.organizations
            .filter(orga => !!orga)
            .map(orga => orga.siren || orga.siret.substring(0, 9));
          if (profile?.email && sirenList) {
            try {
              const useCase = new SyncOwnership(ownershipRepo);
              await useCase.execute({ sirens: sirenList, email: profile.email });
            } catch (error: unknown) {
              logger.error({ error }, "Error while syncing ownerships");
            }
          }
          const companiesList =
            profile?.organizations
              .filter(orga => !!orga)
              .map(orga => ({
                siren: orga.siren || orga.siret.substring(0, 9),
                label: orga.label,
              })) ?? [];

          // Create hash and store companies in Redis
          token.user.companiesHash = await companiesUtils.hashCompanies(companiesList);

          token.user.staff = config.api.staff.includes(profile?.email ?? "");
          token.user.firstname = profile?.given_name ?? void 0;
          token.user.lastname = profile?.family_name ?? void 0;
          token.user.phoneNumber = profile?.phone_number ?? void 0;
        }

        // Token legacy for usage with API v1.
        token.user.tokenApiV1 = createTokenApiV1(token.email);

        try {
          const companiesHash = token.user.companiesHash || "";

          logger.info(
            {
              companiesHash,
            },
            "Companies hash in token",
          );

          logger.info(
            {
              tokenSize: JSON.stringify(token).length,
            },
            "Total token size",
          );
        } catch (error) {
          logger.error(
            {
              err: error,
            },
            "Error while logging token",
          );
        }
        return token;
      } catch (error: unknown) {
        logger.error(
          {
            error,
          },
          "Error while creating token",
        );
        throw new Error("Error while creating token");
      }
    },
    async session({ session, token }) {
      session.user = JSON.parse(JSON.stringify(token.user)); // very important ! to avoid token mutation. Else the companies are added to the token and the headers will too big & rejected by nginx
      session.user.email = token.email;
      session.staff = {};

      // Load companies from Redis using the hash if it exists
      if (token.user.companiesHash) {
        try {
          const companies = await companiesUtils.getCompaniesFromRedis(token.user.companiesHash);
          if (companies.length > 0) {
            session.user.companies = companies;
          }
        } catch (error) {
          logger.error(
            {
              error,
            },
            "Error loading companies from Redis",
          );
        }
      }

      if (token.user.staff || token.staff.impersonating) {
        session.staff = token.staff;

        // Load last impersonated companies if hash exists
        if (token.staff.lastImpersonatedHash) {
          try {
            const lastImpersonated = await companiesUtils.getCompaniesFromRedis(token.staff.lastImpersonatedHash);
            if (lastImpersonated.length > 0) {
              // For backward compatibility, include the actual companies in the session
              session.user.lastImpersonated = lastImpersonated;
            }
          } catch (error) {
            logger.error(
              {
                error,
              },
              "Error loading last impersonated companies from Redis",
            );
          }
        }
      }
      return session;
    },
  },
};

/**
 * Create a token in API v1 expected format.
 * See packages/api/egapro/tokens.py@create for further details.
 */
const createTokenApiV1 = (email: string) => {
  return jwt.sign(
    {
      sub: email,
    },
    config.api.security.jwtv1.secret,
    {
      algorithm: config.api.security.jwtv1.algorithm as jwt.Algorithm,
      expiresIn: "24h",
    },
  );
};
