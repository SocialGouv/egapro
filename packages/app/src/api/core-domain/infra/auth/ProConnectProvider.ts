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
      url: config.proconnect.authorization_endpoint,
      params: {
        scope,
        prompt: "select_account",
      },
    },
    userinfo: {
      url: config.proconnect.userinfo_endpoint,
      async request({ tokens }) {
        if (!tokens.access_token) {
          throw new Error("No access token");
        }

        const response = await fetch(config.proconnect.userinfo_endpoint, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        });

        if (!response.ok) {
          const text = await response.text();
          logger.error({ status: response.status, body: text }, "ProConnect userinfo error");
          throw new Error(`ProConnect userinfo failed: ${response.status}`);
        }

        const body = await response.text();

        // integ01 renvoie un JWT, prod renvoie du JSON → on gère les deux
        if (body.includes(".")) {
          const payload = body.split(".")[1];
          const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
          const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
          return JSON.parse(Buffer.from(padded, "base64").toString("utf-8"));
        }

        return JSON.parse(body);
      },
    },
    checks: ["pkce", "state"],
    profile(profile) {
      console.log("userinfo décodé →", JSON.stringify(profile, null, 2));
      return {
        id: profile.sub,
        email: profile.email,
        given_name: profile.given_name,
        family_name: profile.usual_name,
        phone_number: profile.phone_number?.replace(/[.\-\s]/g, ""),
        email_verified: profile.email_verified ?? false,
        job: profile.job,
        organizations: profile.organizations || [],
        sub: profile.sub,
        updated_at: profile.updated_at,
      };
    },
    ...options,
  };
}
