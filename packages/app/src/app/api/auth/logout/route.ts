import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { env } from "~/env";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { parseSiren } from "~/modules/domain";
import { logAction } from "~/server/audit/log";
import { buildRequestContext } from "~/server/audit/requestContext";
import { fetchEndSessionEndpoint } from "~/server/auth/proconnect-logout";

/**
 * Custom logout route. Performs a browser-side OIDC RP-initiated logout:
 *
 *   1. Audit the intent.
 *   2. Clear the local NextAuth session cookie on the redirect response.
 *   3. Redirect the browser to ProConnect's `end_session_endpoint` with
 *      `id_token_hint` (so the IdP knows which session to terminate) and
 *      `post_logout_redirect_uri` pointing back to /api/auth/logout/callback.
 *
 * The redirect MUST happen in the browser — a server-side fetch cannot
 * kill the IdP SSO cookie that lives in the user's browser. If the
 * end_session_endpoint cannot be discovered (issuer unreachable, etc.) we
 * fall back to a local-only logout and redirect home directly.
 */
export async function GET(request: NextRequest) {
	const token = await getToken({ req: request });
	const baseUrl = new URL(env.NEXTAUTH_URL).origin;

	if (token) {
		const requestContext = buildRequestContext(request.headers);
		const tokenWithEmail = token as typeof token & {
			email?: string | null;
			siret?: string | null;
		};
		await logAction({
			action: AUDIT_ACTIONS.AUTH_LOGOUT,
			status: "success",
			userId: token.id ?? null,
			userEmail: tokenWithEmail.email ?? null,
			siren: parseSiren(tokenWithEmail.siret),
			ipAddress: requestContext.ipAddress,
			userAgent: requestContext.userAgent,
		});
	}

	const redirectTarget = await buildLogoutRedirectUrl(token?.id_token, baseUrl);
	const response = NextResponse.redirect(redirectTarget);

	// Clear the local NextAuth session cookie eagerly so the user is logged
	// out of egapro even if the IdP round-trip never completes (network blip,
	// user closes the tab, ProConnect outage). Set is used over delete because
	// cookies.delete() omits the Secure flag, which browsers silently ignore
	// on `__Secure-` prefixed cookies.
	const isSecure = baseUrl.startsWith("https://");
	const sessionCookieName = isSecure
		? "__Secure-next-auth.session-token"
		: "next-auth.session-token";
	response.cookies.set(sessionCookieName, "", {
		expires: new Date(0),
		path: "/",
		secure: isSecure,
		httpOnly: true,
		sameSite: "lax",
	});

	return response;
}

async function buildLogoutRedirectUrl(
	idToken: string | null | undefined,
	baseUrl: string,
): Promise<URL> {
	if (!idToken) {
		return new URL("/", baseUrl);
	}
	const endSessionEndpoint = await fetchEndSessionEndpoint();
	if (!endSessionEndpoint) {
		return new URL("/", baseUrl);
	}
	const url = new URL(endSessionEndpoint);
	url.searchParams.set("id_token_hint", idToken);
	url.searchParams.set(
		"post_logout_redirect_uri",
		`${baseUrl}/api/auth/logout/callback`,
	);
	return url;
}
