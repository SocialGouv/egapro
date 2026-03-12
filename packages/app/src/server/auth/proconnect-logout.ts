import { eq } from "drizzle-orm";

import { env } from "~/env";
import { db } from "~/server/db";
import { accounts, sessions } from "~/server/db/schema";

interface OidcConfig {
	end_session_endpoint: string;
}

/**
 * Terminate the ProConnect OIDC session server-side and clean up local sessions.
 *
 * Steps:
 * 1. Fetch the user's id_token from the accounts table
 * 2. Delete all sessions for the user from the DB
 * 3. Fetch the end_session_endpoint from the configured issuer (charon proxy)
 * 4. Call end_session_endpoint server-side with id_token_hint (fire-and-forget)
 *
 * The browser is NOT redirected to ProConnect — the caller handles the redirect
 * directly to /login. This avoids the post_logout_redirect_uri registration issue
 * with ProConnect (charon proxy does not handle end_session redirect flow).
 *
 * Silently fails if ProConnect is unreachable — the local session is already cleared.
 */
export async function terminateProConnectSession(
	userId: string,
): Promise<void> {
	if (!env.EGAPRO_PROCONNECT_ISSUER || !env.EGAPRO_PROCONNECT_CLIENT_ID) {
		return;
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
