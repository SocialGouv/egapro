import { type NextRequest, NextResponse } from "next/server";

import { env } from "~/env";
import { auth } from "~/server/auth";
import { buildProConnectLogoutUrl } from "~/server/auth/proconnect-logout";

/**
 * Custom logout route that terminates both the local NextAuth session
 * and the ProConnect OIDC session (via browser redirect).
 *
 * Flow:
 * 1. Delete the local JWT cookie on the response
 * 2. Redirect the browser to ProConnect's end_session_endpoint
 *    → ProConnect clears its own session cookie in the browser
 *    → ProConnect redirects back to our post_logout_redirect_uri (home page)
 *
 * If ProConnect is unavailable or not configured, falls back to a simple
 * redirect to the home page.
 */
export async function GET(_request: NextRequest) {
	const session = await auth();
	const baseUrl = new URL(env.NEXTAUTH_URL).origin;

	let redirectTo = `${baseUrl}/`;
	if (session?.user?.id) {
		const proConnectUrl = await buildProConnectLogoutUrl(
			session.user.id,
			`${baseUrl}/`,
		);
		if (proConnectUrl) {
			redirectTo = proConnectUrl;
		}
	}

	const response = NextResponse.redirect(redirectTo);

	// Delete the NextAuth session cookie directly on the redirect response
	// to ensure the Set-Cookie header is included in the 307 response.
	// Using cookies() from next/headers does not propagate to NextResponse.redirect().
	const sessionCookieName = baseUrl.startsWith("https://")
		? "__Secure-next-auth.session-token"
		: "next-auth.session-token";
	response.cookies.delete(sessionCookieName);

	return response;
}
