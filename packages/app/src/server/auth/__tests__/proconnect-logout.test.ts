import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";

import { terminateProConnectSession } from "../proconnect-logout";

describe("terminateProConnectSession", () => {
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

	it("calls end_session_endpoint with id_token_hint", async () => {
		mockFetch
			.mockResolvedValueOnce({
				json: () =>
					Promise.resolve({
						end_session_endpoint:
							"https://proconnect.example.com/api/v2/session/end",
					}),
			})
			.mockResolvedValueOnce(new Response());

		await terminateProConnectSession("test-id-token");

		expect(mockFetch).toHaveBeenCalledTimes(2);
		// First call: OIDC discovery
		expect(mockFetch.mock.calls[0]?.[0]).toContain(
			".well-known/openid-configuration",
		);
		// Second call: end_session_endpoint with id_token_hint
		const logoutUrl = new URL(mockFetch.mock.calls[1]?.[0] as string);
		expect(logoutUrl.origin).toBe("https://proconnect.example.com");
		expect(logoutUrl.searchParams.get("id_token_hint")).toBe("test-id-token");
	});

	it("returns early when end_session_endpoint is missing from discovery", async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve({}),
		});

		await terminateProConnectSession("test-id-token");

		// Only the discovery call, no logout call
		expect(mockFetch).toHaveBeenCalledTimes(1);
	});

	it("silently fails when OIDC discovery fetch throws", async () => {
		mockFetch.mockRejectedValue(new Error("Network error"));

		await expect(
			terminateProConnectSession("test-id-token"),
		).resolves.toBeUndefined();
	});

	it("silently fails when end_session fetch throws", async () => {
		mockFetch
			.mockResolvedValueOnce({
				json: () =>
					Promise.resolve({
						end_session_endpoint:
							"https://proconnect.example.com/api/v2/session/end",
					}),
			})
			.mockRejectedValueOnce(new Error("Connection refused"));

		await expect(
			terminateProConnectSession("test-id-token"),
		).resolves.toBeUndefined();
	});
});
