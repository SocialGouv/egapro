import NextAuth, { type NextAuthOptions, type User } from "next-auth";
import { type OAuthConfig } from "next-auth/providers/oauth";
import { type TokenSetParameters } from "openid-client";

// Configuration pour ProConnect
const proconnectConfig: OAuthConfig<Record<string, unknown>> = {
  id: "proconnect",
  name: "ProConnect",
  type: "oauth",
  wellKnown:
    process.env.PROCONNECT_WELL_KNOWN || "https://auth.agentconnect.gouv.fr/api/v2/.well-known/openid-configuration",
  clientId: process.env.PROCONNECT_CLIENT_ID || "",
  clientSecret: process.env.PROCONNECT_CLIENT_SECRET || "",
  authorization: {
    params: {
      scope: "openid email profile",
      acr_values: "eidas1",
      prompt: "login consent",
    },
  },
  token: {
    params: {},
  },
  userinfo: {
    params: {},
  },
  idToken: true,
  checks: ["pkce", "state"],
  profile(profile: Record<string, unknown>, tokens: TokenSetParameters): User {
    return {
      id: profile.sub as string,
      name: (profile.name as string) || (profile.preferred_username as string),
      email: profile.email as string,
      image: profile.picture as string,
    };
  },
};

export const authOptions: NextAuthOptions = {
  providers: [proconnectConfig],
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  logger: {
    error(code, metadata) {
      console.error(`[next-auth][error][${code}]`, metadata);
    },
    warn(code) {
      console.warn(`[next-auth][warn][${code}]`);
    },
    debug(code, metadata) {
      console.log(`[next-auth][debug][${code}]`, metadata);
    },
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Ajouter les informations d'authentification au token JWT
      if (account && profile) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      // Ajouter les informations du token à la session
      session.user = token;
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
