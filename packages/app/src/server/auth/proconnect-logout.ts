import { eq } from "drizzle-orm";

import { env } from "~/env";
import { db } from "~/server/db";
import { accounts, sessions } from "~/server/db/schema";

interface OidcConfig {
	end_session_endpoint: string;
}

/**
 * Build the ProConnect OIDC logout URL and delete the local session from the DB.
 *
 * Steps:
 * 1. Fetch the user's id_token from the accounts table
 * 2. Delete all sessions for the user from the DB
 * 3. Fetch the end_session_endpoint from the configured issuer (charon proxy)
 * 4. Return the full redirect URL with id_token_hint + redirect_uri
 *
 * Uses EGAPRO_PROCONNECT_ISSUER (charon proxy) so that charon can intercept
 * the redirect_uri and whitelist it dynamically for all environments
 * (review branches, preprod, prod).
 *
 * If ProConnect is not configured or no id_token is found, falls back to /login.
 */
export async function getProConnectLogoutUrl(
	userId: string,
	baseUrl: string,
): Promise<string> {
	const fallbackUrl = `${baseUrl}/login`;

	if (!env.EGAPRO_PROCONNECT_ISSUER || !env.EGAPRO_PROCONNECT_CLIENT_ID) {
		return fallbackUrl;
	}

	// Fetch the stored id_token for this user's ProConnect account
	const account = await db.query.accounts.findFirst({
		where: eq(accounts.userId, userId),
		columns: { id_token: true },
	});

	// Delete all local sessions for this user
	await db.delete(sessions).where(eq(sessions.userId, userId));

	const idToken = account?.id_token;
	if (!idToken) {
		return fallbackUrl;
	}

	// Use the configured issuer (charon proxy) to discover the end_session_endpoint.
	// Charon handles redirect_uri whitelisting for all environments.
	const wellKnownUrl = `${env.EGAPRO_PROCONNECT_ISSUER}/.well-known/openid-configuration`;

	try {
		const response = await fetch(wellKnownUrl);
		const config = (await response.json()) as OidcConfig;

		if (!config.end_session_endpoint) {
			return fallbackUrl;
		}

		const logoutUrl = new URL(config.end_session_endpoint);
		logoutUrl.searchParams.set("id_token_hint", idToken);
		// Use redirect_uri (not post_logout_redirect_uri) so that the Charon proxy
		// can intercept it and whitelist dynamically for all environments.
		logoutUrl.searchParams.set("redirect_uri", `${baseUrl}/login`);

		return logoutUrl.toString();
	} catch {
		return fallbackUrl;
	}
}
