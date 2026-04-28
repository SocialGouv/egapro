import { NextResponse } from "next/server";

import { env } from "~/env";

/**
 * OIDC RP-initiated logout callback.
 *
 * Hit by ProConnect (via charon's logout dispatcher) after the IdP SSO
 * cookie has been cleared. The local NextAuth cookie was already cleared
 * by /api/auth/logout, so this route only redirects the user back to the
 * home page.
 */
export function GET() {
	const baseUrl = new URL(env.NEXTAUTH_URL).origin;
	return NextResponse.redirect(new URL("/", baseUrl));
}
