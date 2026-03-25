import crypto from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";

import { env } from "~/env";
import { auth } from "~/server/auth";
import { buildProConnectLogoutUrl } from "~/server/auth/proconnect-logout";

export const LOGOUT_STATE_COOKIE = "proconnect-logout-state";

/**
 * Custom logout route that terminates both the local NextAuth session
 * and the ProConnect OIDC session (via browser redirect).
 *
 * Flow (per ProConnect spec §2.4):
 * 1. Generate a random `state` and store it in a cookie (for CSRF verification)
 * 2. Delete the local JWT session cookie
 * 3. Redirect the browser to ProConnect's end_session_endpoint (via Charon)
 *    → ProConnect clears its own session cookie in the browser
 *    → ProConnect redirects back to /api/auth/logout-callback
 * 4. The logout-callback route verifies the `state` and redirects to home
 *
 * If ProConnect is unavailable or not configured, falls back to a simple
 * redirect to the home page.
 */
export async function GET(_request: NextRequest) {
	const session = await auth();
	const baseUrl = new URL(env.NEXTAUTH_URL).origin;
	const isSecure = baseUrl.startsWith("https://");

	const state = crypto.randomBytes(32).toString("hex");
	let redirectTo = `${baseUrl}/`;
	let setStateCookie = false;

	if (session?.user?.id) {
		const proConnectUrl = await buildProConnectLogoutUrl(
			session.user.id,
			`${baseUrl}/api/auth/logout-callback`,
			state,
		);
		if (proConnectUrl) {
			redirectTo = proConnectUrl;
			setStateCookie = true;
		}
	}

	const response = NextResponse.redirect(redirectTo);

	// Delete the NextAuth session cookie directly on the redirect response
	// to ensure the Set-Cookie header is included in the 307 response.
	const sessionCookieName = isSecure
		? "__Secure-next-auth.session-token"
		: "next-auth.session-token";
	response.cookies.delete(sessionCookieName);

	// Store the state in a short-lived cookie for verification in the callback
	// (ProConnect spec §2.4.3: verify state to prevent CSRF on logout)
	if (setStateCookie) {
		response.cookies.set(LOGOUT_STATE_COOKIE, state, {
			httpOnly: true,
			secure: isSecure,
			sameSite: "lax",
			path: "/api/auth/logout-callback",
			maxAge: 300,
		});
	}

	return response;
}
