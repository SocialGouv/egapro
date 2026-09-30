import { logger } from "@api/utils/pino";
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
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

// One key set per issuer: jose caches the keys and refetches them on rotation.
const jwksByUri = new Map<string, JWTVerifyGetKey>();
const getJwks = (jwksUri: string) => {
  let jwks = jwksByUri.get(jwksUri);
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(jwksUri));
    jwksByUri.set(jwksUri, jwks);
  }
  return jwks;
};

/**
 * Verify the signed userinfo JWT against the issuer's published keys (JWKS from the discovery
 * document): the claims decide which companies the user can declare for, so they are only
 * trusted once the signature, the issuer and (when present) the audience are checked.
 */
export async function verifyUserinfoJwt(
  jwt: string,
  { issuer, jwksUri, clientId }: { clientId: string; issuer: string; jwksUri: string },
  jwks: JWTVerifyGetKey = getJwks(jwksUri),
): Promise<ProConnectProfile> {
  const { payload } = await jwtVerify(jwt, jwks, { issuer });
  if (payload.aud !== undefined) {
    const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audiences.includes(clientId)) {
      throw new Error("ProConnectProvider - userinfo JWT audience mismatch.");
    }
  }
  return payload as unknown as ProConnectProfile;
}

export function ProConnectProvider<P extends ProConnectProfile>(
  options: OAuthUserConfig<P> & { appTest?: boolean },
): OAuthConfig<P> {
  const scope = process.env.EGAPRO_PROCONNECT_SCOPE;
  const proconnectDiscoveryUrl = process.env.EGAPRO_PROCONNECT_DISCOVERY_URL;

  return {
    id: "proconnect",
    type: "oauth",
    name: "Mon Compte Pro",
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
        // OAuth callback. Fetch the endpoint ourselves and verify the JWT.
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

        const { issuer, jwks_uri } = client.issuer.metadata;
        if (!jwks_uri) {
          throw new Error("ProConnectProvider - jwks_uri missing from discovery.");
        }

        return verifyUserinfoJwt(body, { issuer, jwksUri: jwks_uri, clientId: String(client.metadata.client_id) });
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
