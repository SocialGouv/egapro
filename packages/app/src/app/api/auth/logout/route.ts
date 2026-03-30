import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { env } from "~/env";
import { terminateProConnectSession } from "~/server/auth/proconnect-logout";

/**
 * Custom logout route that terminates both the local NextAuth session
 * and the ProConnect OIDC session (server-side fire-and-forget).
 *
 * The browser is always redirected to / (home page) — the ProConnect end_session
 * is called server-side to avoid post_logout_redirect_uri registration issues.
 */
export async function GET(request: NextRequest) {
	const token = await getToken({ req: request });
	// Use the public origin from NEXTAUTH_URL to avoid localhost redirects behind reverse proxies
	const baseUrl = new URL(env.NEXTAUTH_URL).origin;

	if (token?.id_token) {
		// Terminate ProConnect OIDC session server-side (fire-and-forget)
		await terminateProConnectSession(token.id_token);
	}

	const response = NextResponse.redirect(new URL("/", baseUrl));

	// Delete the NextAuth session cookie directly on the redirect response
	// to ensure the Set-Cookie header is included in the 307 response.
	// Using cookies() from next/headers does not propagate to NextResponse.redirect().
	const isSecure = baseUrl.startsWith("https://");
	const sessionCookieName = isSecure
		? "__Secure-next-auth.session-token"
		: "next-auth.session-token";
	// Explicit set with matching attributes — cookies.delete() omits the Secure
	// flag, so browsers silently ignore the deletion for __Secure- prefixed cookies.
	response.cookies.set(sessionCookieName, "", {
		expires: new Date(0),
		path: "/",
		secure: isSecure,
		httpOnly: true,
		sameSite: "lax",
	});

	return response;
}
