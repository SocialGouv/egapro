import { logger } from "@api/utils/pino";
import { type OAuthConfig, type OAuthUserConfig } from "next-auth/providers/oauth";

export interface Organization {
  id: number;
  is_collectivite_territoriale: boolean;
  is_external: boolean;
  is_service_public: boolean;
  label: string | null;
  siren: string;
  siret: string;
}

export interface ProConnectProfile {
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

export function ProConnectProvider<P extends ProConnectProfile>(
  options: OAuthUserConfig<P> & { appTest?: boolean },
): OAuthConfig<P> {
  const scope = process.env.EGAPRO_PROCONNECT_SCOPE;
  const proconnectDiscoveryUrl = process.env.EGAPRO_PROCONNECT_DISCOVERY_URL;

  return {
    id: "moncomptepro",
    type: "oauth",
    name: "Mon Compte Pro",
    allowDangerousEmailAccountLinking: true,
    wellKnown: `${proconnectDiscoveryUrl}/.well-known/openid-configuration`,
    authorization: {
      params: { scope },
    },
    checks: ["pkce", "state"],
    userinfo: {
      async request({ tokens: { access_token }, client }) {
        // logger.child({ tokens: { access_token } }).info(`userinfo request`);
        logger.info(`userinfo request`);
        if (!access_token) {
          throw new Error("ProConnectProvider - Userinfo request is missing access_token.");
        }

        return client.userinfo<ProConnectProfile>(access_token);
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
