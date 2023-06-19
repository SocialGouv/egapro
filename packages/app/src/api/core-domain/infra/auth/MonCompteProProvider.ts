import { type OAuthConfig, type OAuthUserConfig } from "next-auth/providers";

export interface Organization {
  id: number;
  is_collectivite_territoriale: boolean;
  is_external: boolean;
  is_service_public: boolean;
  label: string | null;
  siret: string;
}

export interface MonCompteProProfile {
  email: string;
  email_verified: boolean;
  family_name: string | null;
  given_name: string | null;
  job: string | null;
  organizations: Organization[];
  phone_number: string | null;
  sub: string;
  updated_at: Date;
}

const ISSUER = (appTest: boolean) => `https://app${appTest ? "-test" : ""}.moncomptepro.beta.gouv.fr`;
export function MonCompteProProvider<P extends MonCompteProProfile>(
  options: Omit<OAuthUserConfig<P>, "issuer"> & { appTest?: boolean },
): OAuthConfig<P> {
  const issuer = ISSUER(options.appTest ?? false);
  return {
    id: "moncomptepro",
    name: "Mon Compte Pro",
    type: "oauth",
    issuer,
    wellKnown: `${issuer}/.well-known/openid-configuration`,
    allowDangerousEmailAccountLinking: true,
    authorization: {
      params: {
        scope: "openid email profile organizations",
      },
    },
    checks: ["pkce", "state"],
    userinfo: {
      async request({ tokens: { access_token }, client, provider: { issuer } }) {
        if (!issuer || !access_token) {
          throw new Error(
            `MonCompteProProvider - Userinfo request is missing parameters. (${{ issuer, access_token }})`,
          );
        }

        return client.userinfo<MonCompteProProfile>(access_token);
      },
    },
    profile(profile) {
      return {
        id: profile.sub,
        email: profile.email,
        name: profile.given_name,
      };
    },
    options,
  };
}
