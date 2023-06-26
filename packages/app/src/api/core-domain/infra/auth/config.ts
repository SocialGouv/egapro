import { type MonCompteProProfile, MonCompteProProvider } from "@api/core-domain/infra/auth/MonCompteProProvider";
import { config } from "@common/config";
import { Octokit } from "@octokit/rest";
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

export const monCompteProProvider = MonCompteProProvider(config.api.security.moncomptepro);
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
      authorization: {
        url: "https://github.com/login/oauth/authorize",
        params: { scope: "user:email read:user read:org" },
      },
    }),
    // GithubOAuth2ProxyProvider(config.api.security.github),
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
      return token;
    },
    // expose data from jwt to front
    session({ session, token }) {
      session.user.staff = token.staff;
      session.user.companies = token.companies;
      session.user.firstname = token.firstname;
      session.user.lastname = token.lastname;
      session.user.phoneNumber = token.phoneNumber;
      return session;
    },
  },
};
