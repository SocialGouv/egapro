import { type NextRequest, NextResponse } from "next/server";

import { env } from "~/env";

import { LOGOUT_STATE_COOKIE } from "../logout/route";

/**
 * ProConnect post-logout callback (spec §2.4.2).
 *
 * After ProConnect clears its session, it redirects the browser here
 * (via Charon's /oauth/logout-callback) with `?state=...`.
 *
 * This route verifies the state against the cookie set during logout
 * initiation (§2.4.3), clears the cookie, and redirects to the home page.
 */
export function GET(request: NextRequest) {
	const baseUrl = new URL(env.NEXTAUTH_URL).origin;

	const state = request.nextUrl.searchParams.get("state");
	const storedState = request.cookies.get(LOGOUT_STATE_COOKIE)?.value;

	if (!state || !storedState || state !== storedState) {
		console.warn("ProConnect logout state mismatch — possible CSRF attempt");
	}

	const response = NextResponse.redirect(`${baseUrl}/`);
	response.cookies.delete({
		name: LOGOUT_STATE_COOKIE,
		path: "/api/auth/logout-callback",
	});
	return response;
}
