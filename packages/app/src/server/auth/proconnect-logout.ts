import { env } from "~/env";

interface OidcConfig {
	end_session_endpoint?: string;
}

/**
 * Discover ProConnect's `end_session_endpoint` from the OIDC well-known doc.
 *
 * Returns `null` if the issuer is not configured or the endpoint cannot be
 * resolved (network error, malformed response). Callers are expected to
 * fall back to a local-only logout in that case.
 *
 * The browser — not the server — must navigate to this endpoint with
 * `id_token_hint` and `post_logout_redirect_uri` for OIDC RP-initiated
 * logout to actually kill the IdP SSO cookie. A server-side fetch cannot
 * reach the cookie that lives in the user's browser.
 */
export async function fetchEndSessionEndpoint(): Promise<string | null> {
	if (!env.EGAPRO_PROCONNECT_ISSUER) {
		return null;
	}
	try {
		const response = await fetch(
			`${env.EGAPRO_PROCONNECT_ISSUER}/.well-known/openid-configuration`,
		);
		const config = (await response.json()) as OidcConfig;
		return config.end_session_endpoint ?? null;
	} catch {
		return null;
	}
}
