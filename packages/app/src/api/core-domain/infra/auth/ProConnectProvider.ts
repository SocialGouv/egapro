// @api/core-domain/infra/auth/ProConnectProvider.ts

import { logger } from "@api/utils/pino";
import { config } from "@common/config";
import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers/oauth";

export interface Entreprise {
  id: number;
  is_collectivite_territoriale: boolean;
  is_external: boolean;
  is_service_public: boolean;
  label: string | null;
  siren: string;
  siret: string;
  naf: string;
  address: string;
}

export interface ProConnectProfile {
  sub: string;
  email: string;
  email_verified?: boolean;
  given_name?: string | null;
  usual_name?: string | null;
  siret?: string;
  phone_number?: string | null;
  aud?: string;
  iss?: string;
  iat?: number;
  exp?: number;
}

export function ProConnectProvider<P extends ProConnectProfile>(
  options?: OAuthUserConfig<P>,
): OAuthConfig<P> {
  const { proconnect } = config;

  return {
    id: "proconnect",
    name: "ProConnect",
    type: "oauth",
    wellKnown: proconnect.well_known,
    authorization: {
      url: proconnect.authorization_endpoint,
      params: {
        scope: "openid email given_name usual_name siret",
        prompt: "login",
        max_age: 0,
      },
    },
    token: {
      url: proconnect.token_endpoint,
    },
    userinfo: {
      url: proconnect.userinfo_endpoint,
      async request({ tokens }) {
        if (!tokens.access_token) {
          logger.error("❌ Pas d'access_token disponible pour userinfo");
          throw new Error("No access token");
        }

        try {
          const response = await fetch(proconnect.userinfo_endpoint, {
            headers: {
              Authorization: `Bearer ${tokens.access_token}`,
              Accept: "application/json",
            },
            cache: "no-store",
          });

          if (!response.ok) {
            const text = await response.text();
            logger.error(
              {
                status: response.status,
                statusText: response.statusText,
                url: proconnect.userinfo_endpoint,
                body: text,
              },
              "❌ Userinfo request failed",
            );
            throw new Error(`ProConnect userinfo failed: ${response.status}`);
          }

          const contentType = response.headers.get("content-type") || "";
          const rawBody = await response.text();

          if (contentType.includes("jwt") || rawBody.startsWith("ey")) {
            const parts = rawBody.trim().split(".");
            if (parts.length !== 3) throw new Error("Invalid JWT format");

            let payload = parts[1];
            payload += "=".repeat((4 - (payload.length % 4)) % 4);
            const decoded = JSON.parse(
              Buffer.from(payload, "base64url").toString("utf-8"),
            );
            return decoded;
          }

          return JSON.parse(rawBody);
        } catch (error) {
          logger.error(
            {
              error: error instanceof Error ? error.message : String(error),
              url: proconnect.userinfo_endpoint,
            },
            "❌ Erreur lors de la requête userinfo",
          );
          throw error;
        }
      },
    },
    client: {
      token_endpoint_auth_method: "client_secret_post",
    },
    checks: ["pkce", "state"],
    async profile(profile: ProConnectProfile) {
      return {
        id: profile.sub,
        email: profile.email,
        emailVerified: profile.email_verified ?? false,
        name:
          `${profile.given_name ?? ""} ${profile.usual_name ?? ""}`.trim() ||
          null,
        given_name: profile.given_name ?? null,
        family_name: profile.usual_name ?? null,
        phone_number: profile.phone_number
          ? profile.phone_number.replace(/[.\-\s]/g, "")
          : null,
        siret: profile.siret || null,
        organization: profile.siret
          ? {
              id: parseInt(profile.siret, 10),
              label: null,
              siren: profile.siret.substring(0, 9),
              siret: profile.siret,
              is_collectivite_territoriale: false,
              is_external: false,
              is_service_public: false,
            }
          : undefined,
        raw: profile,
      };
    },
    ...options,
  };
}
