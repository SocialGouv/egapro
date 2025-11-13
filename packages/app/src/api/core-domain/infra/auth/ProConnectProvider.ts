// @api/core-domain/infra/auth/ProConnectProvider.ts

import { logger } from "@api/utils/pino";
import { config } from "@common/config";
import {
  type OAuthConfig,
  type OAuthUserConfig,
} from "next-auth/providers/oauth";

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
  usual_name: string | null;
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
  const scope = config.proconnect.scope;
  const proconnectDiscoveryUrl = config.proconnect.issuer;

  return {
    id: "proconnect",
    type: "oauth",
    name: "ProConnect",
    allowDangerousEmailAccountLinking: true,
    issuer: proconnectDiscoveryUrl,
    jwks_endpoint: proconnectDiscoveryUrl.includes('localhost') ? `${proconnectDiscoveryUrl}/protocol/openid-connect/certs` : `${proconnectDiscoveryUrl}/jwks`,
    authorization: {
      url: config.proconnect.authorization_endpoint,
      params: { scope },
    },
    token: config.proconnect.token_endpoint,
    checks: ["pkce", "state"],
    idToken: config.env === "prod",
    userinfo: config.proconnect.userinfo_endpoint,
    profile(profile) {
      return {
        id: profile.sub,
        email: profile.email,
        given_name: profile.given_name,
        family_name: profile.usual_name,
        phone_number: profile.phone_number?.replace(/[.\-\s]/g, ""),
        email_verified: profile.email_verified,
        job: profile.job,
        organizations: profile.organizations || [],
        sub: profile.sub,
        updated_at: profile.updated_at,
      };
    },
    ...options,
  };
}
