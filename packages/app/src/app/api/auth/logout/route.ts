import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { env } from "~/env";
import { auth } from "~/server/auth";
import { terminateProConnectSession } from "~/server/auth/proconnect-logout";

/**
 * Custom logout route that terminates both the local NextAuth session
 * and the ProConnect OIDC session (server-side fire-and-forget).
 *
 * The browser is always redirected to /login — the ProConnect end_session
 * is called server-side to avoid post_logout_redirect_uri registration issues.
 */
export async function GET(_request: NextRequest) {
	const session = await auth();
	// Use the public origin from NEXTAUTH_URL to avoid localhost redirects behind reverse proxies
	const baseUrl = new URL(env.NEXTAUTH_URL).origin;

	// Clear the NextAuth session cookie
	const cookieStore = await cookies();
	const sessionCookieName = baseUrl.startsWith("https://")
		? "__Secure-next-auth.session-token"
		: "next-auth.session-token";
	cookieStore.delete(sessionCookieName);

	if (session?.user?.id) {
		// Terminate ProConnect OIDC session server-side (fire-and-forget)
		await terminateProConnectSession(session.user.id);
	}

	return NextResponse.redirect(new URL("/login", baseUrl));
}
