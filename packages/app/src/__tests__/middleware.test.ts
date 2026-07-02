import type { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const GATEWAY_SECRET = "test-gateway-shared-secret-at-least-32-chars";

const { mockGetToken } = vi.hoisted(() => ({
	mockGetToken: vi.fn(),
}));

vi.mock("next-auth/jwt", () => ({ getToken: mockGetToken }));
vi.mock("~/env", () => ({
	env: {
		AUTH_SECRET: "test-secret",
		EGAPRO_GATEWAY_SHARED_SECRET:
			"test-gateway-shared-secret-at-least-32-chars",
	},
}));

import { middleware } from "~/middleware";

function makeRequest(
	pathnameAndSearch = "/admin",
	headers: Record<string, string> = {},
): NextRequest {
	const url = `http://localhost${pathnameAndSearch}`;
	const parsed = new URL(url);
	const headerMap = new Map(
		Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
	);
	return {
		url,
		nextUrl: {
			pathname: parsed.pathname,
			search: parsed.search,
			searchParams: parsed.searchParams,
		},
		headers: {
			get: (name: string) => headerMap.get(name.toLowerCase()) ?? null,
		},
	} as unknown as NextRequest;
}

describe("admin middleware", () => {
	beforeEach(() => {
		mockGetToken.mockReset();
	});

	it("redirects to /login with callbackUrl when there is no token", async () => {
		mockGetToken.mockResolvedValue(null);
		const res = await middleware(makeRequest("/admin/users"));
		expect(res.headers.get("location")).toBe(
			"http://localhost/login?callbackUrl=%2Fadmin%2Fusers",
		);
	});

	it("preserves the query string in the callbackUrl", async () => {
		mockGetToken.mockResolvedValue(null);
		const res = await middleware(makeRequest("/admin/users?tab=active&page=2"));
		expect(res.headers.get("location")).toBe(
			"http://localhost/login?callbackUrl=%2Fadmin%2Fusers%3Ftab%3Dactive%26page%3D2",
		);
	});

	it("forces re-login when the token has no isAdmin field (pre-PR token)", async () => {
		mockGetToken.mockResolvedValue({ id: "u1" });
		const res = await middleware(makeRequest("/admin"));
		expect(res.headers.get("location")).toBe(
			"http://localhost/login?callbackUrl=%2Fadmin",
		);
	});

	it("redirects non-admin users to /mon-espace", async () => {
		mockGetToken.mockResolvedValue({ id: "u1", isAdmin: false });
		const res = await middleware(makeRequest("/admin"));
		expect(res.headers.get("location")).toBe("http://localhost/mon-espace");
	});

	it("lets admin users through", async () => {
		mockGetToken.mockResolvedValue({ id: "u1", isAdmin: true });
		const res = await middleware(makeRequest("/admin"));
		// NextResponse.next() does not set a redirect location
		expect(res.headers.get("location")).toBeNull();
	});
});

describe("session middleware (session-gated user routes)", () => {
	beforeEach(() => {
		mockGetToken.mockReset();
	});

	// Routes covered by the matcher block — must capture the requested URL into
	// `callbackUrl` so the user lands back on the page they originally aimed at
	// after ProConnect sign-in (ticket #3617).
	const sessionGatedPaths = [
		"/mon-espace/historique/123456789/2024",
		"/declaration-remuneration/commencer",
		"/avis-cse/2024/123456789",
	];

	for (const path of sessionGatedPaths) {
		it(`redirects an unauthenticated user from ${path} to /login with callbackUrl`, async () => {
			mockGetToken.mockResolvedValue(null);
			const res = await middleware(makeRequest(path));
			const expectedCallback = encodeURIComponent(path);
			expect(res.headers.get("location")).toBe(
				`http://localhost/login?callbackUrl=${expectedCallback}`,
			);
		});

		it(`lets an authenticated user through on ${path}`, async () => {
			mockGetToken.mockResolvedValue({ id: "u1" });
			const res = await middleware(makeRequest(path));
			// NextResponse.next() does not set a redirect location
			expect(res.headers.get("location")).toBeNull();
		});
	}

	it("preserves the query string when redirecting an unauthenticated user", async () => {
		mockGetToken.mockResolvedValue(null);
		const res = await middleware(makeRequest("/avis-cse?annee=2024"));
		expect(res.headers.get("location")).toBe(
			"http://localhost/login?callbackUrl=%2Favis-cse%3Fannee%3D2024",
		);
	});

	it("does not enforce isAdmin on session-gated routes", async () => {
		// A non-admin authenticated user must reach `/mon-espace`, unlike on
		// `/admin/*` where they would be redirected away. Guards against a
		// regression where the session middleware accidentally inherits the
		// admin check.
		mockGetToken.mockResolvedValue({ id: "u1", isAdmin: false });
		const res = await middleware(makeRequest("/mon-espace"));
		expect(res.headers.get("location")).toBeNull();
	});
});

describe("gateway middleware (/api/v1/*)", () => {
	it("lets the request through when X-Gateway-Forwarded is absent (session branch)", async () => {
		// Mixed endpoints (e.g. /api/v1/files/:fileId) serve browser users
		// via NextAuth session — the handler enforces auth, not the middleware.
		const res = await middleware(makeRequest("/api/v1/files/abc"));
		expect(res.status).toBe(200);
		expect(res.headers.get("x-middleware-next")).toBeTruthy();
	});

	it("lets the request through when X-Gateway-Forwarded matches the shared secret", async () => {
		const res = await middleware(
			makeRequest("/api/v1/export/declarations", {
				"x-gateway-forwarded": GATEWAY_SECRET,
			}),
		);
		expect(res.status).toBe(200);
		expect(res.headers.get("x-middleware-next")).toBeTruthy();
	});

	it("returns 403 when X-Gateway-Forwarded is present but wrong", async () => {
		const res = await middleware(
			makeRequest("/api/v1/export/declarations", {
				"x-gateway-forwarded": "definitely-not-the-right-secret-value-here",
			}),
		);
		expect(res.status).toBe(403);
	});

	it("returns 403 when X-Gateway-Forwarded is present but empty", async () => {
		// `headers.get` returns "" for an empty header value (not null), and
		// `headers.has` returns true — if the middleware treated empty as
		// absent, an in-cluster attacker could send `X-Gateway-Forwarded:`
		// (empty) to fall through to the session branch while still satisfying
		// `isGatewayForwarded()` in mixed-endpoint dispatch, bypassing both
		// APISIX (Bearer + rate-limit) and the session check. Must be 403.
		const res = await middleware(
			makeRequest("/api/v1/export/declarations", {
				"x-gateway-forwarded": "",
			}),
		);
		expect(res.status).toBe(403);
	});

	it("rejects a header value that shares only the prefix of the secret", async () => {
		// Guards against accidentally using `startsWith` or similar in the
		// constant-time compare.
		const res = await middleware(
			makeRequest("/api/v1/files", {
				"x-gateway-forwarded": GATEWAY_SECRET.slice(0, 20),
			}),
		);
		expect(res.status).toBe(403);
	});

	it("rejects a header value longer than the secret", async () => {
		const res = await middleware(
			makeRequest("/api/v1/files", {
				"x-gateway-forwarded": `${GATEWAY_SECRET}-extra-suffix`,
			}),
		);
		expect(res.status).toBe(403);
	});

	it("does not call getToken on /api/v1/* (avoids unnecessary JWT parsing)", async () => {
		mockGetToken.mockReset();
		await middleware(
			makeRequest("/api/v1/files/abc", {
				"x-gateway-forwarded": GATEWAY_SECRET,
			}),
		);
		expect(mockGetToken).not.toHaveBeenCalled();
	});
});

describe("search redirect (/api/search → /api/public/declarations)", () => {
	async function redirectTarget(pathnameAndSearch: string): Promise<URL> {
		const res = (await middleware(
			makeRequest(pathnameAndSearch),
		)) as NextResponse;
		const location = res.headers.get("location");
		if (location === null) {
			throw new Error("expected a redirect location header");
		}
		return new URL(location);
	}

	it("redirects to /api/public/declarations with a 308 status", async () => {
		const res = (await middleware(makeRequest("/api/search"))) as NextResponse;
		expect(res.status).toBe(308);
		expect(new URL(res.headers.get("location") ?? "").pathname).toBe(
			"/api/public/declarations",
		);
	});

	it("preserves the passthrough query params unchanged", async () => {
		const target = await redirectTarget(
			"/api/search?q=test&departement=75&region=11&limit=20&offset=40",
		);
		expect(target.searchParams.get("q")).toBe("test");
		expect(target.searchParams.get("departement")).toBe("75");
		expect(target.searchParams.get("region")).toBe("11");
		expect(target.searchParams.get("limit")).toBe("20");
		expect(target.searchParams.get("offset")).toBe("40");
	});

	it("renames section_naf to naf", async () => {
		const target = await redirectTarget("/api/search?section_naf=A");
		expect(target.searchParams.get("naf")).toBe("A");
		expect(target.searchParams.has("section_naf")).toBe(false);
	});

	it("renames section_naf while keeping the other params (S7)", async () => {
		const target = await redirectTarget("/api/search?section_naf=A&q=test");
		expect(target.pathname).toBe("/api/public/declarations");
		expect(target.searchParams.get("naf")).toBe("A");
		expect(target.searchParams.get("q")).toBe("test");
		expect(target.searchParams.has("section_naf")).toBe(false);
	});

	it("redirects with no query string when none is provided", async () => {
		const target = await redirectTarget("/api/search");
		expect(target.pathname).toBe("/api/public/declarations");
		expect(target.search).toBe("");
	});

	it("does not call getToken on /api/search (no JWT parsing on a public redirect)", async () => {
		mockGetToken.mockReset();
		await middleware(makeRequest("/api/search?q=test"));
		expect(mockGetToken).not.toHaveBeenCalled();
	});
});
