import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/auth/proconnect-logout", () => ({
	buildProConnectLogoutUrl: vi.fn(),
}));

import { env } from "~/env";
import { auth } from "~/server/auth";
import { buildProConnectLogoutUrl } from "~/server/auth/proconnect-logout";

const mockAuth = vi.mocked(auth);
const mockBuildUrl = vi.mocked(buildProConnectLogoutUrl);

// Dynamic import to ensure mocks are registered before the module loads
const { GET } = await import("~/app/api/auth/logout/route");

function buildRequest() {
	return new Request(
		"http://localhost:3000/api/auth/logout",
	) as unknown as NextRequest;
}

function mockSession(user: Record<string, unknown>) {
	mockAuth.mockResolvedValue({
		user: { id: "", siret: null, phone: null, ...user },
		expires: "2026-12-31T00:00:00.000Z",
	});
}

describe("GET /api/auth/logout", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Default: no post_logout_redirect_uri (review app mode)
		(
			env as Record<string, unknown>
		).EGAPRO_PROCONNECT_POST_LOGOUT_REDIRECT_URI = undefined;
	});

	it("redirects to the home page when no session", async () => {
		mockAuth.mockResolvedValue(null);

		const response = await GET(buildRequest());

		expect(response.status).toBe(307);
		expect(response.headers.get("Location")).toBe("http://localhost:3000/");
	});

	it("deletes the session cookie on the response", async () => {
		mockAuth.mockResolvedValue(null);

		const response = await GET(buildRequest());

		const setCookie = response.headers.get("set-cookie");
		expect(setCookie).toContain("next-auth.session-token");
		expect(setCookie).toContain("Expires=Thu, 01 Jan 1970");
	});

	it("skips ProConnect logout when post_logout_redirect_uri is not configured", async () => {
		mockSession({ id: "user-123", email: "test@example.com" });

		const response = await GET(buildRequest());

		expect(response.status).toBe(307);
		expect(response.headers.get("Location")).toBe("http://localhost:3000/");
		expect(mockBuildUrl).not.toHaveBeenCalled();
	});

	it("redirects to ProConnect end_session URL when post_logout_redirect_uri is configured", async () => {
		(
			env as Record<string, unknown>
		).EGAPRO_PROCONNECT_POST_LOGOUT_REDIRECT_URI =
			"https://egapro.travail.gouv.fr/";
		mockSession({ id: "user-123", email: "test@example.com", name: "Test" });
		mockBuildUrl.mockResolvedValue(
			"https://proconnect.example.com/session/end?id_token_hint=tok",
		);

		const response = await GET(buildRequest());

		expect(response.status).toBe(307);
		expect(response.headers.get("Location")).toBe(
			"https://proconnect.example.com/session/end?id_token_hint=tok",
		);
		expect(mockBuildUrl).toHaveBeenCalledWith(
			"user-123",
			"https://egapro.travail.gouv.fr/",
		);
	});

	it("falls back to home page when ProConnect URL is null", async () => {
		(
			env as Record<string, unknown>
		).EGAPRO_PROCONNECT_POST_LOGOUT_REDIRECT_URI =
			"https://egapro.travail.gouv.fr/";
		mockSession({ id: "user-123", email: "test@example.com" });
		mockBuildUrl.mockResolvedValue(null);

		const response = await GET(buildRequest());

		expect(response.status).toBe(307);
		expect(response.headers.get("Location")).toBe("http://localhost:3000/");
	});

	it("still deletes cookie when redirecting to ProConnect", async () => {
		(
			env as Record<string, unknown>
		).EGAPRO_PROCONNECT_POST_LOGOUT_REDIRECT_URI =
			"https://egapro.travail.gouv.fr/";
		mockSession({ id: "user-123" });
		mockBuildUrl.mockResolvedValue(
			"https://proconnect.example.com/session/end",
		);

		const response = await GET(buildRequest());

		const setCookie = response.headers.get("set-cookie");
		expect(setCookie).toContain("next-auth.session-token");
		expect(setCookie).toContain("Expires=Thu, 01 Jan 1970");
	});

	it("does not call buildProConnectLogoutUrl when no session", async () => {
		(
			env as Record<string, unknown>
		).EGAPRO_PROCONNECT_POST_LOGOUT_REDIRECT_URI =
			"https://egapro.travail.gouv.fr/";
		mockAuth.mockResolvedValue(null);

		await GET(buildRequest());

		expect(mockBuildUrl).not.toHaveBeenCalled();
	});

	it("does not call buildProConnectLogoutUrl when session has no user id", async () => {
		(
			env as Record<string, unknown>
		).EGAPRO_PROCONNECT_POST_LOGOUT_REDIRECT_URI =
			"https://egapro.travail.gouv.fr/";
		mockSession({ id: "", email: "test@example.com" });

		await GET(buildRequest());

		expect(mockBuildUrl).not.toHaveBeenCalled();
	});
});
