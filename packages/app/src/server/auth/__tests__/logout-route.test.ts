import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/server/auth", () => ({
	auth: vi.fn(),
}));

vi.mock("~/server/auth/proconnect-logout", () => ({
	terminateProConnectSession: vi.fn(),
}));

import { auth } from "~/server/auth";
import { terminateProConnectSession } from "~/server/auth/proconnect-logout";

const mockAuth = vi.mocked(auth);
const mockTerminate = vi.mocked(terminateProConnectSession);

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
	});

	it("redirects to the home page", async () => {
		mockAuth.mockResolvedValue(null);

		const response = await GET(buildRequest());

		expect(response.status).toBe(307);
		expect(response.headers.get("Location")).toBe("http://localhost:3000/");
	});

	it("deletes the session cookie on the response with correct attributes", async () => {
		mockAuth.mockResolvedValue(null);

		const response = await GET(buildRequest());

		const setCookie = response.headers.get("set-cookie");
		expect(setCookie).toContain("next-auth.session-token=");
		expect(setCookie).toContain("Expires=Thu, 01 Jan 1970");
		expect(setCookie).toContain("Path=/");
		expect(setCookie).toContain("HttpOnly");
		expect(setCookie).toContain("SameSite=lax");
	});

	it("calls terminateProConnectSession when user is logged in", async () => {
		mockSession({ id: "user-123", email: "test@example.com", name: "Test" });

		await GET(buildRequest());

		expect(mockTerminate).toHaveBeenCalledWith("user-123");
	});

	it("does not call terminateProConnectSession when no session", async () => {
		mockAuth.mockResolvedValue(null);

		await GET(buildRequest());

		expect(mockTerminate).not.toHaveBeenCalled();
	});

	it("does not call terminateProConnectSession when session has no user id", async () => {
		mockSession({ id: "", email: "test@example.com" });

		await GET(buildRequest());

		expect(mockTerminate).not.toHaveBeenCalled();
	});

	it("propagates error when terminateProConnectSession fails", async () => {
		mockSession({ id: "user-123" });
		mockTerminate.mockRejectedValue(new Error("Network error"));

		await expect(GET(buildRequest())).rejects.toThrow("Network error");
	});
});
