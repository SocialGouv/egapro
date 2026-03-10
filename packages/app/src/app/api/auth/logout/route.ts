import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { auth } from "~/server/auth";
import { getProConnectLogoutUrl } from "~/server/auth/proconnect-logout";

/**
 * Custom logout route that terminates both the local NextAuth session
 * and the ProConnect OIDC session (via end_session_endpoint).
 */
export async function GET(request: NextRequest) {
	const session = await auth();
	const baseUrl = request.nextUrl.origin;

	// Clear the NextAuth session cookie
	const cookieStore = await cookies();
	const sessionCookieName = baseUrl.startsWith("https://")
		? "__Secure-next-auth.session-token"
		: "next-auth.session-token";
	cookieStore.delete(sessionCookieName);

	if (!session?.user?.id) {
		return NextResponse.redirect(new URL("/login", baseUrl));
	}

	const logoutUrl = await getProConnectLogoutUrl(session.user.id, baseUrl);

	return NextResponse.redirect(logoutUrl);
}
