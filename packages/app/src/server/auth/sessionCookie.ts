import type { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "next-auth.session-token";
const SECURE_COOKIE_PREFIX = "__Secure-";

export function expireSessionCookies(
	request: NextRequest,
	response: NextResponse,
	baseUrl: string,
): void {
	const isSecure = baseUrl.startsWith("https://");
	const sessionCookieName = isSecure
		? `${SECURE_COOKIE_PREFIX}${SESSION_COOKIE_NAME}`
		: SESSION_COOKIE_NAME;

	// getToken() rebuilds the session from every cookie prefixed by <name>, chunks `<name>.N` included.
	const sentSessionCookieNames = request.cookies
		.getAll()
		.map(({ name }) => name)
		.filter((name) => name.startsWith(sessionCookieName));

	for (const name of new Set([sessionCookieName, ...sentSessionCookieNames])) {
		response.cookies.set(name, "", {
			expires: new Date(0),
			path: "/",
			secure: isSecure,
			httpOnly: true,
			sameSite: "lax",
		});
	}
}
