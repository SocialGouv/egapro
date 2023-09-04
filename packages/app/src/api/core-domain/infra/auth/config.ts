import { type MonCompteProProfile, MonCompteProProvider } from "@api/core-domain/infra/auth/MonCompteProProvider";
import { config } from "@common/config";
import { Octokit } from "@octokit/rest";
import jwt from "jsonwebtoken";
import { type AuthOptions, type Session } from "next-auth";
import { type DefaultJWT } from "next-auth/jwt";
import GithubProvider, { type GithubProfile } from "next-auth/providers/github";

import { egaproNextAuthAdapter } from "./EgaproNextAuthAdapter";

declare module "next-auth" {
  interface Session {
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

  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Profile extends MonCompteProProfile {}
}

declare module "next-auth/jwt" {
  type UserSession = Session["user"];
  interface JWT extends DefaultJWT, UserSession {
    email: string;
  }
}

const charonMcpUrl = new URL(
  `moncomptepro${config.api.security.moncomptepro.appTest ? "test" : ""}/`,
  config.api.security.auth.charonUrl,
);
const charonGithubUrl = new URL("github/", config.api.security.auth.charonUrl);
export const monCompteProProvider = MonCompteProProvider({
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
    async jwt({ token, profile, trigger, account }) {
      if (trigger !== "signUp") return token;
      if (account?.provider === "github") {
        const githubProfile = profile as unknown as GithubProfile;
        token.staff = true;
        token.companies = [];
        const [firstname, lastname] = githubProfile.name?.split(" ") ?? [];
        token.firstname = firstname;
        token.lastname = lastname;
      } else {
        token.companies =
          profile?.organizations.map(orga => ({
            siren: orga.siret.substring(0, 9),
            label: orga.label,
          })) ?? [];
        token.staff = false;
        token.firstname = profile?.given_name ?? void 0;
        token.lastname = profile?.family_name ?? void 0;
        token.phoneNumber = profile?.phone_number ?? void 0;
      }

      // Token legacy for usage with API v1.
      token.tokenApiV1 = createTokenApiV1(token.email);

      return token;
    },
    // expose data from jwt to front
    session({ session, token }) {
      session.user.staff = token.staff;
      session.user.companies = token.companies;
      session.user.firstname = token.firstname;
      session.user.lastname = token.lastname;
      session.user.phoneNumber = token.phoneNumber;
      session.user.tokenApiV1 = token.tokenApiV1;
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
      expiresIn: "7d",
    },
  );
};
