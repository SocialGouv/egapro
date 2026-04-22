import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { env } from "~/env";

/**
 * Next.js Edge middleware handling two independent concerns:
 *
 * 1. `/admin/*` — backoffice guard. Decodes the NextAuth JWT and enforces
 *    `isAdmin`. Defense in depth: `src/app/admin/layout.tsx` re-checks the
 *    session on the Node runtime in case the token is missing the flag.
 *
 * 2. `/api/v1/*` — belt-and-suspenders against APISIX bypass. The APISIX
 *    gateway (see `.kontinuous/templates/apisix-suit.configmap.yaml`) injects
 *    `X-Gateway-Forwarded: <EGAPRO_GATEWAY_SHARED_SECRET>` via its
 *    `proxy-rewrite` plugin. A pod compromised in-cluster could otherwise
 *    hit `app:3000/api/v1/*` directly and skip APISIX's Bearer auth +
 *    rate-limit. A NetworkPolicy cannot help here because the app pod also
 *    serves legitimate user traffic (login, déclaration, …) on the same
 *    port. The mixed endpoint `/api/v1/files/:fileId` also uses the header
 *    as the SUIT-vs-session discriminator, so we only validate the header
 *    when it is **present** — absence is forwarded to the route handler
 *    which falls back to NextAuth session auth.
 */
export async function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (pathname.startsWith("/api/v1/")) {
		return gatewayMiddleware(request);
	}

	return adminMiddleware(request);
}

async function adminMiddleware(request: NextRequest) {
	const token = await getToken({ req: request, secret: env.AUTH_SECRET });

	// Force re-login when there is no token OR when the token predates the
	// `isAdmin` field (users signed in before this PR). The DB sync runs in
	// the `jwt` callback on sign-in, so a fresh token is the only way to get
	// the correct flag.
	if (!token || token.isAdmin === undefined) {
		const loginUrl = new URL("/login", request.url);
		loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
		return NextResponse.redirect(loginUrl);
	}

	if (!token.isAdmin) {
		return NextResponse.redirect(new URL("/mon-espace", request.url));
	}

	return NextResponse.next();
}

function gatewayMiddleware(request: NextRequest) {
	const forwarded = request.headers.get("x-gateway-forwarded");

	// Truly absent (header not sent at all) → legitimate session-based call
	// (admin / user) on a mixed endpoint, or a public route. The handler
	// enforces its own auth.
	if (forwarded === null) {
		return NextResponse.next();
	}

	// Header present → must be a non-empty value matching the shared secret.
	// An empty string is nonsensical (APISIX always injects the full secret,
	// no browser sends this header) and is treated as a spoof attempt. This
	// closes the bypass where `headers.get()` returns `""` for an empty
	// header but `headers.has()` returns `true` — keeping middleware and
	// handlers aligned on the same presence definition.
	if (
		forwarded.length === 0 ||
		!constantTimeEqual(forwarded, env.EGAPRO_GATEWAY_SHARED_SECRET)
	) {
		return new NextResponse(null, { status: 403 });
	}

	return NextResponse.next();
}

/**
 * Edge-runtime-safe constant-time string comparison. `node:crypto` is not
 * available on the Edge runtime, so we cannot use `timingSafeEqual` here.
 * This variant always walks the full length of both strings to avoid
 * leaking the secret length via timing.
 */
function constantTimeEqual(a: string, b: string): boolean {
	const len = Math.max(a.length, b.length);
	let mismatch = a.length ^ b.length;
	for (let i = 0; i < len; i++) {
		mismatch |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
	}
	return mismatch === 0;
}

export const config = {
	matcher: ["/admin/:path*", "/api/v1/:path*"],
};
