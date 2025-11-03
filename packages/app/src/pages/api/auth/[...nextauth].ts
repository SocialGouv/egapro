// pages/api/auth/[...nextauth].ts
import { config } from "@common/config";
import NextAuth, { type NextAuthOptions } from "next-auth";

// === Interface pour le profil ProConnect (claims OIDC) ===
interface ProConnectProfile {
  email: string;
  email_verified: boolean;
  family_name?: string;
  given_name?: string;
  name?: string;
  organisation?: string;
  role?: string;
  siret?: string;
  sub: string;
}

// === On étend les types existants (pas de conflit) ===
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    organisation?: string;
    provider?: string;
    siret?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    organisation?: string;
    provider?: string;
    siret?: string;
  }
}

// === Configuration NextAuth ===
const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "proconnect",
      name: "ProConnect",
      type: "oauth",
      wellKnown: config.proconnect.well_known,
      authorization: {
        params: {
          scope: config.proconnect.scope,
        },
      },
      clientId: config.proconnect.clientId,
      clientSecret: config.proconnect.clientSecret,
      checks: ["pkce", "state"],

      // Profil → on ne touche PAS à `user`, on renvoie juste l’id
      profile(profile: ProConnectProfile) {
        return {
          id: profile.sub,
          email: profile.email,
          name: profile.given_name
            ? `${profile.given_name} ${profile.family_name || ""}`.trim()
            : profile.name || profile.email,
        };
      },
    },
  ],

  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const proProfile = profile as ProConnectProfile;

        token.accessToken = account.access_token;
        token.provider = account.provider;
        token.siret = proProfile.siret ?? undefined;
        token.organisation = proProfile.organisation ?? undefined;
      }
      return token;
    },

    async session({ session, token }) {
      // On étend la session existante sans écraser `user`
      session.accessToken = token.accessToken;
      session.provider = token.provider;
      session.siret = token.siret;
      session.organisation = token.organisation;

      // Optionnel : si tu veux que `user.id` soit dispo
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },

  pages: {
    signIn: "/connexion",
    error: "/connexion",
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

export default NextAuth(authOptions);
