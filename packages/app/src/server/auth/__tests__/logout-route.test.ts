import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetToken = vi.fn();
const mockLogAction = vi.fn();

vi.mock("next-auth/jwt", () => ({
	getToken: (...args: unknown[]) => mockGetToken(...args),
}));

vi.mock("~/server/auth/proconnect-logout", () => ({
	fetchEndSessionEndpoint: vi.fn(),
}));

vi.mock("~/server/audit/log", () => ({
	logAction: (...args: unknown[]) => mockLogAction(...args),
}));

import { fetchEndSessionEndpoint } from "~/server/auth/proconnect-logout";

const mockFetchEndSession = vi.mocked(fetchEndSessionEndpoint);

// Dynamic import to ensure mocks are registered before the module loads
const { GET } = await import("~/app/api/auth/logout/route");

function buildRequest() {
	return new Request(
		"http://localhost:3000/api/auth/logout",
	) as unknown as NextRequest;
}

describe("GET /api/auth/logout", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockFetchEndSession.mockResolvedValue(null);
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
});
