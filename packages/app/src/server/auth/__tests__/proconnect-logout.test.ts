import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";

const mockFindFirst = vi.fn();

vi.mock("~/server/db", () => ({
	db: {
		query: {
			accounts: {
				findFirst: (...args: unknown[]) => mockFindFirst(...args),
			},
		},
	},
}));

vi.mock("~/server/db/schema", () => ({
	accounts: { userId: "userId" },
}));

import { buildProConnectLogoutUrl } from "../proconnect-logout";

describe("buildProConnectLogoutUrl", () => {
	let originalFetch: typeof globalThis.fetch;
	let mockFetch: MockInstance;

	beforeEach(() => {
		vi.clearAllMocks();
		originalFetch = globalThis.fetch;
		mockFetch = vi.fn();
		globalThis.fetch = mockFetch as unknown as typeof fetch;
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	it("returns null when no account is found for the user", async () => {
		mockFindFirst.mockResolvedValue(undefined);

		const result = await buildProConnectLogoutUrl(
			"user-123",
			"http://localhost:3000/",
		);

		expect(result).toBeNull();
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("returns null when account has no id_token", async () => {
		mockFindFirst.mockResolvedValue({ id_token: null });

		const result = await buildProConnectLogoutUrl(
			"user-123",
			"http://localhost:3000/",
		);

		expect(result).toBeNull();
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("returns direct ProConnect end_session URL bypassing Charon", async () => {
		mockFindFirst.mockResolvedValue({ id_token: "test-id-token" });
		mockFetch.mockResolvedValueOnce({
			json: () =>
				Promise.resolve({
					// Charon preserves issuer but rewrites end_session_endpoint to itself
					issuer: "https://fca.integ01.dev-agentconnect.fr/api/v2",
					end_session_endpoint:
						"https://proconnect.example.com/session/end",
				}),
		});

		const result = await buildProConnectLogoutUrl(
			"user-123",
			"http://localhost:3000/",
		);

		expect(result).not.toBeNull();
		const url = new URL(result as string);
		// URL should point to the real ProConnect issuer, not Charon
		expect(url.origin).toBe("https://fca.integ01.dev-agentconnect.fr");
		expect(url.pathname).toBe("/api/v2/session/end");
		expect(url.searchParams.get("id_token_hint")).toBe("test-id-token");
		expect(url.searchParams.get("state")).toBeTruthy();
		expect(url.searchParams.get("post_logout_redirect_uri")).toBe(
			"http://localhost:3000/",
		);
		// No redirect_uri — ProConnect rejects extra params on end_session
		expect(url.searchParams.has("redirect_uri")).toBe(false);
	});

	it("returns null when end_session_endpoint is missing from discovery", async () => {
		mockFindFirst.mockResolvedValue({ id_token: "test-id-token" });
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve({}),
		});

		const result = await buildProConnectLogoutUrl(
			"user-123",
			"http://localhost:3000/",
		);

		expect(result).toBeNull();
	});

	it("returns null when OIDC discovery fetch throws", async () => {
		mockFindFirst.mockResolvedValue({ id_token: "test-id-token" });
		mockFetch.mockRejectedValue(new Error("Network error"));

		const result = await buildProConnectLogoutUrl(
			"user-123",
			"http://localhost:3000/",
		);

		expect(result).toBeNull();
	});
});
