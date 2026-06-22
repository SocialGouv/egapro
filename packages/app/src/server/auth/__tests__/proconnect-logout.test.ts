import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";

import { fetchEndSessionEndpoint } from "../proconnect-logout";

describe("fetchEndSessionEndpoint", () => {
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

	it("returns the end_session_endpoint advertised by the OIDC discovery doc", async () => {
		mockFetch.mockResolvedValueOnce({
			json: () =>
				Promise.resolve({
					end_session_endpoint:
						"https://proconnect.example.com/api/v2/session/end",
				}),
		});

		const url = await fetchEndSessionEndpoint();

		expect(url).toBe("https://proconnect.example.com/api/v2/session/end");
		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(mockFetch.mock.calls[0]?.[0]).toContain(
			".well-known/openid-configuration",
		);
	});

	it("returns null when end_session_endpoint is missing from discovery", async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => Promise.resolve({}),
		});

		await expect(fetchEndSessionEndpoint()).resolves.toBeNull();
	});

	it("returns null when the discovery fetch throws", async () => {
		mockFetch.mockRejectedValue(new Error("Network error"));

		await expect(fetchEndSessionEndpoint()).resolves.toBeNull();
	});
});
