import { type NextRequest, NextResponse } from "next/server";

import { env } from "~/env";
import { auth } from "~/server/auth";
import { terminateProConnectSession } from "~/server/auth/proconnect-logout";

/**
 * Custom logout route that terminates both the local NextAuth session
 * and the ProConnect OIDC session (server-side fire-and-forget).
 *
 * The browser is always redirected to / (home page) — the ProConnect end_session
 * is called server-side to avoid post_logout_redirect_uri registration issues.
 */
export async function GET(_request: NextRequest) {
	const session = await auth();
	// Use the public origin from NEXTAUTH_URL to avoid localhost redirects behind reverse proxies
	const baseUrl = new URL(env.NEXTAUTH_URL).origin;

	if (session?.user?.id) {
		// Terminate ProConnect OIDC session server-side (fire-and-forget)
		await terminateProConnectSession(session.user.id);
	}

	const response = NextResponse.redirect(new URL("/", baseUrl));

	// Delete the NextAuth session cookie directly on the redirect response
	// to ensure the Set-Cookie header is included in the 307 response.
	// Using cookies() from next/headers does not propagate to NextResponse.redirect().
	const sessionCookieName = baseUrl.startsWith("https://")
		? "__Secure-next-auth.session-token"
		: "next-auth.session-token";
	response.cookies.delete(sessionCookieName);

	return response;
}
