const discoveryUrl = process.env.EGAPRO_PROCONNECT_DISCOVERY_URL;

interface OidcConfig {
  end_session_endpoint?: string;
}

/**
 * Fetch the OIDC `end_session_endpoint` from the ProConnect discovery document.
 * Returns null when the discovery URL is unset or unreachable, so the logout
 * route can fall back to a plain redirect home.
 */
export async function fetchEndSessionEndpoint(): Promise<string | null> {
  if (!discoveryUrl) {
    return null;
  }
  try {
    const response = await fetch(`${discoveryUrl}/.well-known/openid-configuration`);
    const config = (await response.json()) as OidcConfig;
    return config.end_session_endpoint ?? null;
  } catch {
    return null;
  }
}
