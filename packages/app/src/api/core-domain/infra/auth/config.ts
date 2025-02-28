import { type ProConnectProfile, ProConnectProvider } from "@api/core-domain/infra/auth/ProConnectProvider";
import { globalMailerService } from "@api/core-domain/infra/mail";
import { ownershipRepo } from "@api/core-domain/repo";
import { SyncOwnership } from "@api/core-domain/useCases/SyncOwnership";
import { logger } from "@api/utils/pino";
import { config } from "@common/config";
import { assertImpersonatedSession } from "@common/core-domain/helpers/impersonate";
import { UnexpectedError } from "@common/shared-domain";
import { Email } from "@common/shared-domain/domain/valueObjects";
import { Octokit } from "@octokit/rest";
import jwt from "jsonwebtoken";
import { type AuthOptions, type Session } from "next-auth";
import { type DefaultJWT } from "next-auth/jwt";
import EmailProvider from "next-auth/providers/email";
import GithubProvider, { type GithubProfile } from "next-auth/providers/github";

import { egaproNextAuthAdapter } from "./EgaproNextAuthAdapter";

declare module "next-auth" {
  interface Session {
    staff: {
      impersonating?: boolean;
      lastImpersonated?: Array<{ label: string | null; siren: string }>;
    };
    user: {
      companies: Array<{ label: string | null; siren: string }>;
      email: string;
      firstname?: string;
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

const charonMcpUrl = new URL(
  `moncomptepro${config.api.security.moncomptepro.appTest ? "test" : ""}/`,
  config.api.security.auth.charonUrl,
);
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
      const isStaff = token.user?.staff || token.staff?.impersonating || false;
      if (trigger === "update" && session && isStaff) {
        if (session.staff.impersonating === true) {
          // staff starts impersonating
          assertImpersonatedSession(session);
          token.user.staff = session.user.staff;
          token.user.companies = session.user.companies;
          token.staff.impersonating = true;
          token.staff.lastImpersonated = [
            // keep only unique companies
            ...new Map(
              (token.staff.lastImpersonated ?? [])
                .concat(token.user.companies)
                .filter(c => !!c)
                .map(c => [c.siren, c.label]),
            ).entries(),
          ].map(([siren, label]) => ({ siren, label }));
        } else if (session.staff.impersonating === false) {
          // staff stops impersonating
          token.user.staff = true;
          token.user.companies = [];
          token.staff.impersonating = false;
        }
      }
      if (trigger !== "signUp") return token;
      token.user = {} as Session["user"];
      token.staff = {} as Session["staff"];
      if (account?.provider === "github") {
        const githubProfile = profile as unknown as GithubProfile;
        token.user.staff = true;
        token.user.companies = [];
        const [firstname, lastname] = githubProfile.name?.split(" ") ?? [];
        token.user.firstname = firstname;
        token.user.lastname = lastname;
      } else if (account?.provider === "email") {
        token.user.staff = config.api.staff.includes(profile?.email ?? "");
        if (token.email && !token.user.staff) {
          const companies = await ownershipRepo.getAllSirenByEmail(new Email(token.email));
          token.user.companies = companies.map(siren => ({ label: "", siren }));
        }
      } else {
        const sirenList = profile?.organizations.map(orga => orga.siret.substring(0, 9));
        if (profile?.email && sirenList) {
          try {
            const useCase = new SyncOwnership(ownershipRepo);
            await useCase.execute({ sirens: sirenList, email: profile.email });
          } catch (error: unknown) {
            logger.error({ error }, "Error while syncing ownerships");
          }
        }
        token.user.companies =
          profile?.organizations.map(orga => ({
            siren: orga.siret.substring(0, 9),
            label: orga.label,
          })) ?? [];
        token.user.staff = config.api.staff.includes(profile?.email ?? "");
        token.user.firstname = profile?.given_name ?? void 0;
        token.user.lastname = profile?.family_name ?? void 0;
        token.user.phoneNumber = profile?.phone_number ?? void 0;
      }

      // Token legacy for usage with API v1.
      token.user.tokenApiV1 = createTokenApiV1(token.email);

      try {
        logger.info(
          {
            companies: token.user.companies,
          },
          "Companies in token",
        );
        logger.info(
          {
            companiesLength: token.user.companies.length,
          },
          "Number of companies in token",
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
    },
    // expose data from jwt to front
    session({ session, token }) {
      session.user = token.user;
      session.user.email = token.email;
      session.staff = {};
      if (token.user.staff || token.staff.impersonating) {
        session.staff = token.staff;
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
