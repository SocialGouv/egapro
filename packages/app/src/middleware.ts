import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { env } from "~/env";
import { resolveAdminAccess } from "~/modules/domain";
import {
	ADMIN,
	ADMIN_MFA_RESUME,
	API_PUBLIC_DECLARATIONS,
	API_SEARCH,
	API_V1_FILES,
	API_V1_PREFIX,
	CSE_OPINION,
	DECLARATION_REMUNERATION,
	LOGIN,
	MY_SPACE,
} from "~/modules/routes";
import {
	buildContentSecurityPolicyHeaders,
	generateNonce,
	NONCE_HEADER,
} from "~/server/security/securityHeaders.js";

/**
 * Next.js Edge middleware handling four concerns:
 *
 * 1. `/admin/*` — backoffice guard. Decodes the NextAuth JWT and applies the
 *    shared decision table of `resolveAdminAccess` — admin grant *and* a
 *    two-factor authentication inside the window. Defense in depth:
 *    `src/app/admin/layout.tsx` runs the same table on the Node runtime.
 *
 * 2. `/mon-espace/*`, `/declaration-remuneration/*`, `/avis-cse/*` — session
 *    gating only (no `isAdmin` check). Captures the requested URL into
 *    `callbackUrl` so the user returns to the page they originally aimed at
 *    after ProConnect sign-in. The Node-runtime `auth()` guards in layouts
 *    remain as defense in depth.
 *
 * 3. `/api/v1/*` — belt-and-suspenders against APISIX bypass. The APISIX
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
 *
 * 4. Every response but a stored file — a per-request nonce CSP, also set on
 *    the request so Next.js and server components can stamp the nonce.
 */
type Forward = () => NextResponse;

const SESSION_GATED_SECTIONS = [
	MY_SPACE,
	DECLARATION_REMUNERATION,
	CSE_OPINION,
];

export async function middleware(request: NextRequest) {
	// Chrome's built-in PDF viewer refuses to render a document served inline under a CSP.
	if (isWithin(request.nextUrl.pathname, API_V1_FILES)) {
		return route(request, () => NextResponse.next());
	}

	const nonce = generateNonce();
	const policyHeaders = buildContentSecurityPolicyHeaders({
		isDevelopment: env.NODE_ENV === "development",
		nonce,
		matomoUrl: env.NEXT_PUBLIC_MATOMO_URL,
		sentryDsn: env.NEXT_PUBLIC_SENTRY_DSN,
	});

	const requestHeaders = new Headers(request.headers);
	requestHeaders.set(NONCE_HEADER, nonce);
	requestHeaders.set(
		"Content-Security-Policy",
		policyHeaders["Content-Security-Policy"],
	);

	const response = await route(request, () =>
		NextResponse.next({ request: { headers: requestHeaders } }),
	);
	for (const [name, value] of Object.entries(policyHeaders)) {
		response.headers.set(name, value);
	}
	return response;
}

function route(request: NextRequest, forward: Forward) {
	const { pathname } = request.nextUrl;

	if (pathname === API_SEARCH) {
		return searchRedirect(request);
	}

	if (pathname.startsWith(API_V1_PREFIX)) {
		return gatewayMiddleware(request, forward);
	}

	if (isWithin(pathname, ADMIN)) {
		return adminMiddleware(request, forward);
	}

	if (SESSION_GATED_SECTIONS.some((section) => isWithin(pathname, section))) {
		return sessionMiddleware(request, forward);
	}

	return forward();
}

function isWithin(pathname: string, section: string) {
	return pathname === section || pathname.startsWith(`${section}/`);
}

function searchRedirect(request: NextRequest) {
	const target = new URL(API_PUBLIC_DECLARATIONS, request.url);
	for (const [key, value] of request.nextUrl.searchParams.entries()) {
		target.searchParams.append(key === "section_naf" ? "naf" : key, value);
	}
	return NextResponse.redirect(target, 308);
}

function redirectToLogin(request: NextRequest) {
	const loginUrl = new URL(LOGIN, request.url);
	loginUrl.searchParams.set(
		"callbackUrl",
		`${request.nextUrl.pathname}${request.nextUrl.search}`,
	);
	return NextResponse.redirect(loginUrl);
}

async function adminMiddleware(request: NextRequest, forward: Forward) {
	const token = await getToken({ req: request, secret: env.AUTH_SECRET });

	// The Edge runtime can settle freshness itself: the token is already decoded here, and the rule compares two numbers.
	const decision = resolveAdminAccess(token, new Date());

	switch (decision.type) {
		// The DB sync runs in the `jwt` callback, so a fresh sign-in is the only way to obtain the grant flag.
		case "login":
			return redirectToLogin(request);
		// Silent refusal: a user without the grant is never told the backoffice exists.
		case "monEspace":
			return NextResponse.redirect(new URL(MY_SPACE, request.url));
		// Explicit refusal on an Egapro screen: reopening ProConnect mid-navigation is ruled out by the product.
		case "resume": {
			const resumeUrl = new URL(ADMIN_MFA_RESUME, request.url);
			resumeUrl.searchParams.set(
				"retour",
				`${request.nextUrl.pathname}${request.nextUrl.search}`,
			);
			return NextResponse.redirect(resumeUrl);
		}
		case "allow":
			return noStore(forward());
		default:
			return redirectToLogin(request);
	}
}

// A browser back after an expiry must not restore a backoffice page from the cache.
function noStore(response: NextResponse) {
	response.headers.set("Cache-Control", "no-store");
	return response;
}

async function sessionMiddleware(request: NextRequest, forward: Forward) {
	const token = await getToken({ req: request, secret: env.AUTH_SECRET });

	if (!token) {
		return redirectToLogin(request);
	}

	return forward();
}

function gatewayMiddleware(request: NextRequest, forward: Forward) {
	const forwarded = request.headers.get("x-gateway-forwarded");

	// Truly absent (header not sent at all) → legitimate session-based call
	// (admin / user) on a mixed endpoint, or a public route. The handler
	// enforces its own auth.
	if (forwarded === null) {
		return forward();
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

	return forward();
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

// Every HTML response needs the nonce: only build assets are left out.
export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
