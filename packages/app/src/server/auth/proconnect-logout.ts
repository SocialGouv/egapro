import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { env } from "~/env";
import { db } from "~/server/db";
import { accounts } from "~/server/db/schema";

const oidcConfigSchema = z.object({
	end_session_endpoint: z.string().url(),
});

/**
 * Build the ProConnect OIDC end_session URL for browser-side redirect.
 *
 * The browser must be redirected to this URL so that ProConnect clears its
 * own session cookie. A server-side fetch to end_session_endpoint does NOT
 * clear the browser-side ProConnect session, which causes "phantom" re-login.
 *
 * Returns `null` if ProConnect is not configured, the id_token is missing,
 * or the OIDC discovery fails — in that case the caller should fall back
 * to a simple redirect to the home page.
 */
export async function buildProConnectLogoutUrl(
	userId: string,
	postLogoutRedirectUri: string,
): Promise<string | null> {
	if (!env.EGAPRO_PROCONNECT_ISSUER || !env.EGAPRO_PROCONNECT_CLIENT_ID) {
		return null;
	}

	// Fetch the stored id_token for this user's ProConnect account
	const account = await db.query.accounts.findFirst({
		where: eq(accounts.userId, userId),
		columns: { id_token: true },
	});

	const idToken = account?.id_token;
	if (!idToken) {
		return null;
	}

	// Discover the end_session_endpoint from the OIDC provider
	const wellKnownUrl = `${env.EGAPRO_PROCONNECT_ISSUER}/.well-known/openid-configuration`;

	try {
		const response = await fetch(wellKnownUrl);
		const config = oidcConfigSchema.parse(await response.json());

		const state = crypto.randomBytes(32).toString("hex");

		const logoutUrl = new URL(config.end_session_endpoint);
		logoutUrl.searchParams.set("id_token_hint", idToken);
		logoutUrl.searchParams.set("state", state);
		logoutUrl.searchParams.set(
			"post_logout_redirect_uri",
			postLogoutRedirectUri,
		);

		return logoutUrl.toString();
	} catch {
		// Silently fail — local session cookie is still cleared by the caller
		return null;
	}
}
