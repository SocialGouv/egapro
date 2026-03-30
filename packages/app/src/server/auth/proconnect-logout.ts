import { env } from "~/env";

interface OidcConfig {
	end_session_endpoint: string;
}

/**
 * Terminate the ProConnect OIDC session server-side.
 *
 * Steps:
 * 1. Fetch the end_session_endpoint from the configured issuer (charon proxy)
 * 2. Call end_session_endpoint server-side with id_token_hint (fire-and-forget)
 *
 * The browser is NOT redirected to ProConnect — the caller handles the redirect
 * directly to / (home page). This avoids the post_logout_redirect_uri registration issue
 * with ProConnect (charon proxy does not handle end_session redirect flow).
 *
 * The local session is JWT-based (stateless) — clearing the cookie is handled by the caller.
 * Silently fails if ProConnect is unreachable.
 */
export async function terminateProConnectSession(
	idToken: string,
): Promise<void> {
	if (!env.EGAPRO_PROCONNECT_ISSUER || !env.EGAPRO_PROCONNECT_CLIENT_ID) {
		return;
	}

	// Use the configured issuer (charon proxy) to discover the end_session_endpoint
	const wellKnownUrl = `${env.EGAPRO_PROCONNECT_ISSUER}/.well-known/openid-configuration`;

	try {
		const response = await fetch(wellKnownUrl);
		const config = (await response.json()) as OidcConfig;

		if (!config.end_session_endpoint) {
			return;
		}

		const logoutUrl = new URL(config.end_session_endpoint);
		logoutUrl.searchParams.set("id_token_hint", idToken);

		// Fire-and-forget: terminate the OIDC session on ProConnect server-side
		await fetch(logoutUrl.toString());
	} catch {
		// Silently fail — local session is already cleared
	}
}
