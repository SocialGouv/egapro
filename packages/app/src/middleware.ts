import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { env } from "~/env";

/**
 * Middleware guarding the backoffice (`/admin/*`).
 *
 * Runs on the Edge runtime, so we cannot hit the database here. Instead, we
 * decode the NextAuth JWT and read `isAdmin` from it. The source of truth for
 * the flag (DB + `ADMIN_EMAILS`) is resolved in the `jwt` callback of
 * `~/server/auth/config`.
 *
 * Defense in depth: `src/app/admin/layout.tsx` re-checks the session on the
 * Node runtime in case the token is missing the flag.
 */
export async function middleware(request: NextRequest) {
	const token = await getToken({ req: request, secret: env.AUTH_SECRET });

	if (!token) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
		return NextResponse.redirect(loginUrl);
	}

	if (!token.isAdmin) {
		return NextResponse.redirect(new URL("/mon-espace", request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/admin/:path*"],
};
