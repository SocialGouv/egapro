import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

import { env } from "~/env";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { parseSiren } from "~/modules/domain";
import { logAction } from "~/server/audit/log";
import { buildRequestContext } from "~/server/audit/requestContext";
import { fetchEndSessionEndpoint } from "~/server/auth/proconnect-logout";
import { db } from "~/server/db";
import { releaseAllLocksForUser } from "~/server/services/declarationLockService";

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

		if (token.id) {
			try {
				await releaseAllLocksForUser(db, token.id);
			} catch (error) {
				// best-effort: lock release failure must not block logout
				console.error("[logout] Failed to release locks for user", error);
			}
		}
	}

	const redirectTarget = await buildLogoutRedirectUrl(token?.id_token, baseUrl);
	const response = NextResponse.redirect(redirectTarget);

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
