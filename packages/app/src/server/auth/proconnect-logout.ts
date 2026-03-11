import { eq } from "drizzle-orm";

import { env } from "~/env";
import { db } from "~/server/db";
import { accounts, sessions } from "~/server/db/schema";

interface OidcConfig {
	end_session_endpoint: string;
}

interface JwtPayload {
	iss?: string;
}

/**
 * Extract the `iss` (issuer) claim from a JWT without verifying the signature.
 * Used to discover the real OIDC provider issuer, which may differ from the
 * configured issuer when a proxy (e.g. charon) sits in between.
 */
function extractIssuerFromIdToken(idToken: string): string | undefined {
	const parts = idToken.split(".");
	const payload = parts[1];
	if (!payload) return undefined;

	try {
		const decoded = JSON.parse(
			Buffer.from(payload, "base64url").toString(),
		) as JwtPayload;
		return decoded.iss;
	} catch {
		return undefined;
	}
}

/**
 * Build the ProConnect OIDC logout URL and delete the local session from the DB.
 *
 * Steps:
 * 1. Fetch the user's id_token from the accounts table
 * 2. Delete all sessions for the user from the DB
 * 3. Extract the real issuer from the id_token (bypasses proxy like charon)
 * 4. Fetch the issuer's end_session_endpoint from well-known config
 * 5. Return the full redirect URL with id_token_hint + post_logout_redirect_uri
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

	// Use the real issuer from the id_token rather than the configured one.
	// This ensures we call ProConnect directly even when a proxy (charon)
	// sits in front and doesn't support the end_session_endpoint.
	const issuer =
		extractIssuerFromIdToken(idToken) ?? env.EGAPRO_PROCONNECT_ISSUER;
	const wellKnownUrl = `${issuer}/.well-known/openid-configuration`;

	try {
		const response = await fetch(wellKnownUrl);
		const config = (await response.json()) as OidcConfig;

		if (!config.end_session_endpoint) {
			return fallbackUrl;
		}

		const logoutUrl = new URL(config.end_session_endpoint);
		logoutUrl.searchParams.set("id_token_hint", idToken);
		logoutUrl.searchParams.set("post_logout_redirect_uri", `${baseUrl}/login`);

		return logoutUrl.toString();
	} catch {
		return fallbackUrl;
	}
}
