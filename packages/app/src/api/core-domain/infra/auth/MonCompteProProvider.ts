import { logger } from "@api/utils/pino";
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

const ISSUER = (appTest: boolean) => `https://app${appTest ? "-sandbox" : ""}.moncomptepro.beta.gouv.fr`;
export function MonCompteProProvider<P extends MonCompteProProfile>(
  options: OAuthUserConfig<P> & { appTest?: boolean },
): OAuthConfig<P> {
  const issuer = options.issuer ?? ISSUER(options.appTest ?? false);

  return {
    id: "moncomptepro",
    name: "Mon Compte Pro",
    type: "oauth",
    wellKnown: `${issuer}/.well-known/openid-configuration`,
    allowDangerousEmailAccountLinking: true,
    authorization: {
      params: {
        scope: "openid email profile organizations phone",
      },
    },
    checks: ["pkce", "state"],
    userinfo: {
      async request({ tokens: { access_token }, client }) {
        logger.child({ tokens: { access_token } }).info(`userinfo request`);
        if (!access_token) {
          throw new Error("MonCompteProProvider - Userinfo request is missing access_token.");
        }

        return client.userinfo<MonCompteProProfile>(access_token);
      },
    },
    profile(profile) {
      return {
        id: profile.sub,
        email: profile.email,
        name: profile.given_name,
        phone_number: profile.phone_number?.replace(/[.\-\s]/g, ""), //TODO: remove when handled in MCP
      };
    },
    ...options,
  };
}
