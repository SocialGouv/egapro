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
    wellKnown: `${proconnectDiscoveryUrl}/.well-known/openid-configuration`,
    authorization: {
      params: { scope },
    },
    checks: ["pkce", "state"],
    idToken: true,
    profile: async (profile, tokens) => {
      const response = await fetch(config.proconnect.userinfo_endpoint, {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      const userinfo = await response.json();
      return {
        id: userinfo.sub,
        email: userinfo.email,
        given_name: userinfo.given_name,
        family_name: userinfo.usual_name,
        phone_number: userinfo.phone_number?.replace(/[.\-\s]/g, ""),
        email_verified: userinfo.email_verified,
        job: userinfo.job,
        organizations: userinfo.organizations || [],
        sub: userinfo.sub,
        updated_at: userinfo.updated_at,
      };
    },
    ...options,
  };
}
