import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetToken } = vi.hoisted(() => ({
	mockGetToken: vi.fn(),
}));

vi.mock("next-auth/jwt", () => ({ getToken: mockGetToken }));
vi.mock("~/env", () => ({ env: { AUTH_SECRET: "test-secret" } }));

import { middleware } from "~/middleware";

function makeRequest(pathname = "/admin"): NextRequest {
	const url = `http://localhost${pathname}`;
	return {
		url,
		nextUrl: { pathname },
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
