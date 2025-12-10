import {
  Organization,
  type ProConnectProfile,
  ProConnectProvider,
} from "@api/core-domain/infra/auth/ProConnectProvider";
import {
  companiesUtils,
  type Company,
} from "@api/core-domain/infra/companies-store";
import { logger } from "@api/utils/pino";
import { config } from "@common/config";
import { assertImpersonatedSession } from "@common/core-domain/helpers/impersonate";
import { Octokit } from "@octokit/rest";
import { Session, type AuthOptions } from "next-auth";
import { type DefaultJWT, type JWT } from "next-auth/jwt";
import { SignJWT, jwtVerify } from "jose";
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
      organization?: Organization;
      email: string;
      firstname?: string;
      lastname?: string;
      phoneNumber?: string;
      staff: boolean;
      tokenApiV1: string;
      idToken?: string;
      siret?: string;
      lastImpersonated?: Array<{ label: string | null; siren: string }>;
    };
  }

  interface Profile extends ProConnectProfile {
    organization?: Organization;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT, Session {
    email: string;
  }
}

const charonGithubUrl = new URL("github/", config.api.security.auth.charonUrl);

export const proConnectProvider = ProConnectProvider({
  clientId: config.proconnect.clientId,
  clientSecret: config.proconnect.clientSecret,
});

async function fetchWeezEtablissement(siret: string): Promise<Organization | null> {
  try {
    const url = `https://dgt.rct01.kleegroup.com/weez/api/public/next/etablissement/findbysiret?siret=${siret}&page=0`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      logger.warn({ siret, status: response.status }, "Weez API error");
      return null;
    }

    const data = await response.json() as { content: any[] };
    const etablissement = data.content[0];

    if (!etablissement) {
      logger.warn({ siret }, "No etablissement found in Weez response");
      return null;
    }

    return {
      id: parseInt(etablissement.siret, 10),
      label: etablissement.raisonsociale || null,
      siren: etablissement.siren,
      siret: etablissement.siret,
      is_collectivite_territoriale: false,
      is_external: false,
      is_service_public: false,
    };
  } catch (error) {
    logger.error({ siret, error }, "Weez API fetch failed");
    return null;
  }
}

export const authConfig: AuthOptions = {
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
  session: { strategy: "jwt", maxAge: config.env === "dev" ? 24 * 60 * 60 * 7 : 24 * 60 * 60 },
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
        : { authorization: { params: { scope: "user:email read:user read:org" } } }),
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
        const isStaff =
          token.user?.staff || token.staff?.impersonating || false;

        if (account?.id_token) {
          token.idToken = account.id_token;
        }

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

        if (account?.provider === "github") {
          const githubProfile = profile as unknown as GithubProfile;
          token.user.staff = true;
          const [firstname, lastname] = githubProfile.name?.split(" ") ?? [];
          token.user.firstname = firstname || undefined;
          token.user.lastname = lastname || undefined;

        } else {
          const proConnectProfile = profile as ProConnectProfile;
          logger.info({ proConnectProfile }, "ProConnect profile reçu → enrichissement Weez");

          if (proConnectProfile.siret) {
            const org = await fetchWeezEtablissement(proConnectProfile.siret);
            if (org) {
              token.user.organization = org;
            }
          }

          token.user.staff = config.api.staff.includes(proConnectProfile.email ?? "");
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
      console.log("SESSION", JSON.stringify(session))
      console.log("TOKEN", JSON.stringify(token.user))
      session.user = JSON.parse(JSON.stringify(token.user));
      session.user.email = token.email;
      session.user.idToken = token.idToken as string;
      session.user.siret = token.user.siret;
      session.user.organization = token.user.organization;

      return session;
    },
  },



  jwt: {
    async encode({ token, secret, maxAge }) {
      const secretAsKey = new TextEncoder().encode(secret as string);
      const jwt = new SignJWT(token ?? {}).setProtectedHeader({ alg: "HS256" }).setIssuedAt();
      if (maxAge) jwt.setExpirationTime(Math.floor(Date.now() / 1000) + maxAge);
      return await jwt.sign(secretAsKey);
    },
    async decode({ token, secret }) {
      try {
        const secretAsKey = new TextEncoder().encode(secret as string);
        const { payload } = await jwtVerify(token as string, secretAsKey, { algorithms: ["HS256"] });
        return payload as JWT;
      } catch (error) {
        logger.error({ error }, "Erreur décodage token");
        return null;
      }
    },
  },
};
