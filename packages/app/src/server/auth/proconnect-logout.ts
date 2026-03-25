import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { env } from "~/env";
import { db } from "~/server/db";
import { accounts } from "~/server/db/schema";

const oidcConfigSchema = z.object({
	end_session_endpoint: z.string().url(),
});

let cachedEndSessionEndpoint: string | undefined;

async function getEndSessionEndpoint(): Promise<string> {
	if (cachedEndSessionEndpoint) return cachedEndSessionEndpoint;

	const wellKnownUrl = `${env.EGAPRO_PROCONNECT_ISSUER}/.well-known/openid-configuration`;
	const response = await fetch(wellKnownUrl);

	if (!response.ok) {
		throw new Error(
			`OIDC discovery failed: ${response.status} ${response.statusText}`,
		);
	}

	const config = oidcConfigSchema.parse(await response.json());
	cachedEndSessionEndpoint = config.end_session_endpoint;
	return cachedEndSessionEndpoint;
}

/** @internal Reset cached OIDC discovery — for tests only. */
export function resetEndSessionCache(): void {
	cachedEndSessionEndpoint = undefined;
}

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
	appRedirectUri: string,
): Promise<string | null> {
	if (!env.EGAPRO_PROCONNECT_ISSUER || !env.EGAPRO_PROCONNECT_CLIENT_ID) {
		return null;
	}

	const account = await db.query.accounts.findFirst({
		where: eq(accounts.userId, userId),
		columns: { id_token: true },
	});

	const idToken = account?.id_token;
	if (!idToken) {
		return null;
	}

	try {
		const endSessionEndpoint = await getEndSessionEndpoint();
		const state = crypto.randomBytes(32).toString("hex");

		const logoutUrl = new URL(endSessionEndpoint);
		logoutUrl.searchParams.set("id_token_hint", idToken);
		logoutUrl.searchParams.set("state", state);
		logoutUrl.searchParams.set("post_logout_redirect_uri", appRedirectUri);

		return logoutUrl.toString();
	} catch {
		return null;
	}
}
