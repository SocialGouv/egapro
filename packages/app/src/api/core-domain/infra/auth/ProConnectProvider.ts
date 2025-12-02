import { logger } from "@api/utils/pino";
import { config } from "@common/config";
import type { OAuthConfig, OAuthUserConfig } from "next-auth/providers/oauth";


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
  const isLocalhost = proconnect.issuer.includes("localhost");

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
        if (!tokens.access_token) throw new Error("No access token");

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
            { status: response.status, body: text },
            "ProConnect userinfo error",
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
      },
    },
    checks: ["pkce", "state"],
    profile(profile: ProConnectProfile) {
      logger.info({ profile }, "ProConnect profile reçu");

      return {
        id: profile.sub,
        email: profile.email,
        emailVerified: profile.email_verified ?? false,
        name: `${profile.given_name ?? ""} ${profile.usual_name ?? ""}`.trim() || null,
        given_name: profile.given_name ?? null,
        family_name: profile.usual_name ?? null,
        phone_number: profile.phone_number
          ? profile.phone_number.replace(/[.\-\s]/g, "")
          : null,
        siret: profile.siret || null,
        organizations: "organizations" in profile ? profile.organizations : [],
        raw: profile,
      };
    },
    ...options,
  };
}