import type { NextRequest } from "next/server";
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
	pathname = "/admin",
	headers: Record<string, string> = {},
): NextRequest {
	const url = `http://localhost${pathname}`;
	const headerMap = new Map(
		Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]),
	);
	return {
		url,
		nextUrl: { pathname },
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
