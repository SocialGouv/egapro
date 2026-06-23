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
  organizations: Organization[] | string;
  phone_number: string | null;
  // ProConnect (eidas0) returns the active organization as a single `siret`
  // claim instead of the moncomptepro-style `organizations[]` array.
  siret: string | null;
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
      // eidas0 = lowest *authorized* assurance level, i.e. the most permissive
      // request we can make: the user keeps all their organizations selectable
      // in the ProConnect picker (a stricter level would filter the list).
      // https://partenaires.proconnect.gouv.fr/docs/ressources/norme_eidas
      params: { scope, acr_values: "eidas0" },
    },
    checks: ["pkce", "state"],
    userinfo: {
      async request({ tokens: { access_token }, client }) {
        logger.info(`userinfo request`);
        if (!access_token) {
          throw new Error("ProConnectProvider - Userinfo request is missing access_token.");
        }

        // ProConnect's /userinfo returns a SIGNED JWT (application/jwt), not JSON.
        // openid-client's `client.userinfo()` JSON.parses the raw body and throws
        // ("Unexpected token 'e', \"eyJhbGciOi\"... is not valid JSON"), breaking the
        // OAuth callback. Fetch the endpoint ourselves and decode the JWT payload
        // (same approach as the alpha/V2 provider).
        const userinfoEndpoint = client.issuer.metadata.userinfo_endpoint;
        if (!userinfoEndpoint) {
          throw new Error("ProConnectProvider - userinfo_endpoint missing from discovery.");
        }

        const response = await fetch(userinfoEndpoint, {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        const body = await response.text();

        if (body.startsWith("{")) {
          return JSON.parse(body) as ProConnectProfile;
        }

        const payload = body.split(".")[1];
        if (!payload) {
          throw new Error("ProConnectProvider - invalid JWT received from userinfo.");
        }

        return JSON.parse(Buffer.from(payload, "base64url").toString("utf-8")) as ProConnectProfile;
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
