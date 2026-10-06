// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { env } from "~/env";

const mockGetToken = vi.fn();
const mockLogAction = vi.fn();
const mockReleaseAllLocksForUser = vi.fn();

const fakeDb = { __brand: "db" };

vi.mock("next-auth/jwt", () => ({
	getToken: (...args: unknown[]) => mockGetToken(...args),
}));

vi.mock("~/server/auth/proconnect-logout", () => ({
	fetchEndSessionEndpoint: vi.fn(),
}));

vi.mock("~/server/audit/log", () => ({
	logAction: (...args: unknown[]) => mockLogAction(...args),
}));

vi.mock("~/server/db", () => ({ db: fakeDb }));

vi.mock("~/server/services/declarationLockService", () => ({
	releaseAllLocksForUser: (...args: unknown[]) =>
		mockReleaseAllLocksForUser(...args),
}));

import { fetchEndSessionEndpoint } from "~/server/auth/proconnect-logout";

const mockFetchEndSession = vi.mocked(fetchEndSessionEndpoint);

// Dynamic import to ensure mocks are registered before the module loads
const { GET } = await import("~/app/api/auth/logout/route");

const LOGOUT_URL = "http://localhost:3000/api/auth/logout";
const SESSION_COOKIE = "next-auth.session-token";
const SECURE_SESSION_COOKIE = "__Secure-next-auth.session-token";
const SAME_ORIGIN_NAVIGATION = { "sec-fetch-site": "same-origin" };
const CROSS_SITE_NAVIGATION = {
	"sec-fetch-site": "cross-site",
	origin: "https://attacker.example.com",
	referer: "https://attacker.example.com/trap",
};

function setNextAuthUrl(value: string) {
	(env as { NEXTAUTH_URL: string }).NEXTAUTH_URL = value;
}

function buildRequest(
	headers: Record<string, string> = SAME_ORIGIN_NAVIGATION,
	cookies: Record<string, string> = {},
) {
	const cookieHeader = Object.entries(cookies)
		.map(([name, value]) => `${name}=${value}`)
		.join("; ");
	return new NextRequest(LOGOUT_URL, {
		headers: cookieHeader ? { ...headers, cookie: cookieHeader } : headers,
	});
}

function expiredCookieNames(response: Response) {
	return response.headers
		.getSetCookie()
		.filter((cookie) => cookie.includes("Expires=Thu, 01 Jan 1970"))
		.map((cookie) => cookie.slice(0, cookie.indexOf("=")))
		.sort();
}

function cookiesLeftAfter(
	response: Response,
	sentCookies: Record<string, string>,
) {
	const expired = new Set(expiredCookieNames(response));
	return Object.fromEntries(
		Object.entries(sentCookies).filter(([name]) => !expired.has(name)),
	);
}

describe("GET /api/auth/logout", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetchEndSession.mockResolvedValue(null);
		mockReleaseAllLocksForUser.mockResolvedValue(undefined);
	});

	afterEach(() => {
		setNextAuthUrl("http://localhost:3000/api/auth");
	});

	it("redirects to the home page when no session is active", async () => {
		mockGetToken.mockResolvedValue(null);

		const response = await GET(buildRequest());

		expect(response.status).toBe(307);
		expect(response.headers.get("Location")).toBe("http://localhost:3000/");
	});

	it("redirects to the home page when the session has no id_token", async () => {
		mockGetToken.mockResolvedValue({ id: "user-123" });

		const response = await GET(buildRequest());

		expect(response.status).toBe(307);
		expect(response.headers.get("Location")).toBe("http://localhost:3000/");
		expect(mockFetchEndSession).not.toHaveBeenCalled();
	});

	it("redirects to the home page when end_session_endpoint cannot be discovered", async () => {
		mockGetToken.mockResolvedValue({
			id: "user-123",
			id_token: "oidc-id-token",
		});
		mockFetchEndSession.mockResolvedValue(null);

		const response = await GET(buildRequest());

		expect(response.status).toBe(307);
		expect(response.headers.get("Location")).toBe("http://localhost:3000/");
	});

	it("redirects to end_session_endpoint with id_token_hint and post_logout_redirect_uri when an id_token is present", async () => {
		mockGetToken.mockResolvedValue({
			id: "user-123",
			id_token: "oidc-id-token",
		});
		mockFetchEndSession.mockResolvedValue(
			"https://proconnect.example.com/api/v2/session/end",
		);

		const response = await GET(buildRequest());

		expect(response.status).toBe(307);
		const location = new URL(response.headers.get("Location") ?? "");
		expect(location.origin).toBe("https://proconnect.example.com");
		expect(location.pathname).toBe("/api/v2/session/end");
		expect(location.searchParams.get("id_token_hint")).toBe("oidc-id-token");
		expect(location.searchParams.get("post_logout_redirect_uri")).toBe(
			"http://localhost:3000/api/auth/logout/callback",
		);
	});

	it("deletes the session cookie on the response with correct attributes", async () => {
		mockGetToken.mockResolvedValue(null);

		const response = await GET(buildRequest());

		const setCookie = response.headers.get("set-cookie");
		expect(setCookie).toContain("next-auth.session-token=");
		expect(setCookie).toContain("Expires=Thu, 01 Jan 1970");
		expect(setCookie).toContain("Path=/");
		expect(setCookie).toContain("HttpOnly");
		expect(setCookie).toContain("SameSite=lax");
	});

	it("does not write an audit log when the request is unauthenticated", async () => {
		mockGetToken.mockResolvedValue(null);

		await GET(buildRequest());

		expect(mockLogAction).not.toHaveBeenCalled();
	});

	it("writes an audit log with the user identity when a session is active", async () => {
		mockGetToken.mockResolvedValue({
			id: "user-123",
			email: "user@example.com",
			siret: "12345678900012",
		});

		await GET(buildRequest());

		expect(mockLogAction).toHaveBeenCalledOnce();
		expect(mockLogAction.mock.calls[0]?.[0]).toMatchObject({
			action: "auth.logout",
			status: "success",
			userId: "user-123",
			userEmail: "user@example.com",
			siren: "123456789",
		});
	});

	it("releases all locks held by the user with the db client and user id", async () => {
		mockGetToken.mockResolvedValue({ id: "user-123" });

		await GET(buildRequest());

		expect(mockReleaseAllLocksForUser).toHaveBeenCalledOnce();
		expect(mockReleaseAllLocksForUser).toHaveBeenCalledWith(fakeDb, "user-123");
	});

	it("does not release any lock when the request is unauthenticated", async () => {
		mockGetToken.mockResolvedValue(null);

		await GET(buildRequest());

		expect(mockReleaseAllLocksForUser).not.toHaveBeenCalled();
	});

	it("does not release any lock when the session token carries no user id", async () => {
		mockGetToken.mockResolvedValue({ email: "user@example.com" });

		await GET(buildRequest());

		expect(mockReleaseAllLocksForUser).not.toHaveBeenCalled();
	});

	it("still completes the logout redirect when releasing locks throws", async () => {
		mockGetToken.mockResolvedValue({ id: "user-123" });
		mockReleaseAllLocksForUser.mockRejectedValue(new Error("DB unavailable"));

		const response = await GET(buildRequest());

		expect(mockReleaseAllLocksForUser).toHaveBeenCalledOnce();
		expect(response.status).toBe(307);
		expect(response.headers.get("Location")).toBe("http://localhost:3000/");
		expect(response.headers.get("set-cookie")).toContain(
			"next-auth.session-token=",
		);
	});

	it("expires the base session cookie and every chunk the browser sent", async () => {
		mockGetToken.mockResolvedValue({ id: "user-123" });

		const response = await GET(
			buildRequest(SAME_ORIGIN_NAVIGATION, {
				[`${SESSION_COOKIE}.0`]: "chunk-0",
				[`${SESSION_COOKIE}.1`]: "chunk-1",
				[`${SESSION_COOKIE}.2`]: "chunk-2",
				"other-cookie": "kept",
			}),
		);

		expect(expiredCookieNames(response)).toEqual([
			SESSION_COOKIE,
			`${SESSION_COOKIE}.0`,
			`${SESSION_COOKIE}.1`,
			`${SESSION_COOKIE}.2`,
		]);
		for (const cookie of response.headers.getSetCookie()) {
			expect(cookie).toContain("Path=/");
			expect(cookie).toContain("HttpOnly");
			expect(cookie).toContain("SameSite=lax");
			expect(cookie).not.toContain("Secure");
		}
	});

	it("expires the __Secure- prefixed chunks with the Secure attribute behind HTTPS", async () => {
		setNextAuthUrl("https://egapro.example.fr/api/auth");
		mockGetToken.mockResolvedValue(null);

		const response = await GET(
			buildRequest(SAME_ORIGIN_NAVIGATION, {
				[`${SECURE_SESSION_COOKIE}.0`]: "chunk-0",
				[`${SECURE_SESSION_COOKIE}.1`]: "chunk-1",
			}),
		);

		expect(expiredCookieNames(response)).toEqual([
			SECURE_SESSION_COOKIE,
			`${SECURE_SESSION_COOKIE}.0`,
			`${SECURE_SESSION_COOKIE}.1`,
		]);
		for (const cookie of response.headers.getSetCookie()) {
			expect(cookie).toContain("Secure");
		}
	});

	it("leaves no cookie from which next-auth can rebuild a chunked session", async () => {
		const realJwt =
			await vi.importActual<typeof import("next-auth/jwt")>("next-auth/jwt");
		const secret = "test-secret";
		const chunkSize = 3933;
		const sessionToken = await realJwt.encode({
			secret,
			token: {
				id: "user-123",
				isAdmin: false,
				id_token: "x".repeat(3 * chunkSize),
			},
		});
		const sentCookies: Record<string, string> = {};
		for (let index = 0; index * chunkSize < sessionToken.length; index++) {
			sentCookies[`${SESSION_COOKIE}.${index}`] = sessionToken.slice(
				index * chunkSize,
				(index + 1) * chunkSize,
			);
		}
		mockGetToken.mockImplementation((params: { req: NextRequest }) =>
			realJwt.getToken({ ...params, secret, secureCookie: false }),
		);
		const request = buildRequest(SAME_ORIGIN_NAVIGATION, sentCookies);

		expect(Object.keys(sentCookies).length).toBeGreaterThan(1);
		await expect(
			realJwt.getToken({ req: request, secret, secureCookie: false }),
		).resolves.toMatchObject({ id: "user-123" });

		const response = await GET(request);
		const nextRequest = buildRequest(
			SAME_ORIGIN_NAVIGATION,
			cookiesLeftAfter(response, sentCookies),
		);

		expect(mockReleaseAllLocksForUser).toHaveBeenCalledWith(fakeDb, "user-123");
		await expect(
			realJwt.getToken({ req: nextRequest, secret, secureCookie: false }),
		).resolves.toBeNull();
	});

	it.each([
		["same-origin", SAME_ORIGIN_NAVIGATION],
		["none (typed in the address bar)", { "sec-fetch-site": "none" }],
		["absent (no Fetch Metadata support)", {}],
	])("logs out when Sec-Fetch-Site is %s", async (_label, headers) => {
		mockGetToken.mockResolvedValue({ id: "user-123" });

		const response = await GET(
			buildRequest(headers, { [SESSION_COOKIE]: "session" }),
		);

		expect(mockReleaseAllLocksForUser).toHaveBeenCalledOnce();
		expect(mockLogAction).toHaveBeenCalledOnce();
		expect(expiredCookieNames(response)).toEqual([SESSION_COOKIE]);
	});

	it("refuses a cross-site logout without any side effect", async () => {
		mockGetToken.mockResolvedValue({
			id: "user-123",
			id_token: "oidc-id-token",
		});
		mockFetchEndSession.mockResolvedValue(
			"https://proconnect.example.com/api/v2/session/end",
		);

		const response = await GET(
			buildRequest(CROSS_SITE_NAVIGATION, {
				[`${SESSION_COOKIE}.0`]: "chunk-0",
				[`${SESSION_COOKIE}.1`]: "chunk-1",
			}),
		);

		expect(response.status).toBe(307);
		expect(response.headers.get("Location")).toBe("http://localhost:3000/");
		expect(response.headers.getSetCookie()).toEqual([]);
		expect(mockGetToken).not.toHaveBeenCalled();
		expect(mockLogAction).not.toHaveBeenCalled();
		expect(mockReleaseAllLocksForUser).not.toHaveBeenCalled();
		expect(mockFetchEndSession).not.toHaveBeenCalled();
	});

	it("refuses a same-site logout coming from another subdomain", async () => {
		mockGetToken.mockResolvedValue({ id: "user-123" });

		const response = await GET(
			buildRequest({
				"sec-fetch-site": "same-site",
				referer: "https://other.localhost:3000/page",
			}),
		);

		expect(response.headers.getSetCookie()).toEqual([]);
		expect(mockReleaseAllLocksForUser).not.toHaveBeenCalled();
	});
});
