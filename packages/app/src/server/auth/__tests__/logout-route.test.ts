import type { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetToken = vi.fn();

vi.mock("next-auth/jwt", () => ({
	getToken: (...args: unknown[]) => mockGetToken(...args),
}));

vi.mock("~/server/auth/proconnect-logout", () => ({
	terminateProConnectSession: vi.fn(),
}));

import { terminateProConnectSession } from "~/server/auth/proconnect-logout";

const mockTerminate = vi.mocked(terminateProConnectSession);

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
	});

	it("redirects to the home page", async () => {
		mockGetToken.mockResolvedValue(null);

		const response = await GET(buildRequest());

		expect(response.status).toBe(307);
		expect(response.headers.get("Location")).toBe("http://localhost:3000/");
	});

	it("deletes the session cookie on the response", async () => {
		mockGetToken.mockResolvedValue(null);

		const response = await GET(buildRequest());

		const setCookie = response.headers.get("set-cookie");
		expect(setCookie).toContain("next-auth.session-token");
		expect(setCookie).toContain("Expires=Thu, 01 Jan 1970");
	});

	it("calls terminateProConnectSession with id_token when present", async () => {
		mockGetToken.mockResolvedValue({
			id: "user-123",
			id_token: "oidc-id-token",
		});

		await GET(buildRequest());

		expect(mockTerminate).toHaveBeenCalledWith("oidc-id-token");
	});

	it("does not call terminateProConnectSession when no token", async () => {
		mockGetToken.mockResolvedValue(null);

		await GET(buildRequest());

		expect(mockTerminate).not.toHaveBeenCalled();
	});

	it("does not call terminateProConnectSession when token has no id_token", async () => {
		mockGetToken.mockResolvedValue({ id: "user-123" });

		await GET(buildRequest());

		expect(mockTerminate).not.toHaveBeenCalled();
	});

	it("propagates error when terminateProConnectSession fails", async () => {
		mockGetToken.mockResolvedValue({
			id: "user-123",
			id_token: "oidc-id-token",
		});
		mockTerminate.mockRejectedValue(new Error("Network error"));

		await expect(GET(buildRequest())).rejects.toThrow("Network error");
	});
});
