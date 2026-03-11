import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchCseBySiren } from "../suit";

vi.mock("~/env", () => ({
	env: {
		EGAPRO_SUIT_API_URL: "https://api.suit.example.com",
	},
}));

describe("fetchCseBySiren", () => {
	const fetchSpy = vi.fn();

	beforeEach(() => {
		vi.stubGlobal("fetch", fetchSpy);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns true when the company has a CSE", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ siren: "339787277", CSE: true }),
		});

		const result = await fetchCseBySiren("339787277");

		expect(result).toBe(true);
		expect(fetchSpy).toHaveBeenCalledWith(
			"https://api.suit.example.com/suit/api/externe/portail/CSE/339787277",
			expect.objectContaining({
				headers: { Accept: "application/json" },
			}),
		);
	});

	it("returns false when the company has no CSE", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ siren: "123456789", CSE: false }),
		});

		const result = await fetchCseBySiren("123456789");

		expect(result).toBe(false);
	});

	it("returns null on non-ok response", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: false,
			status: 404,
		});

		const result = await fetchCseBySiren("000000000");

		expect(result).toBeNull();
	});

	it("returns null on network error", async () => {
		fetchSpy.mockRejectedValueOnce(new Error("Network error"));

		const result = await fetchCseBySiren("123456789");

		expect(result).toBeNull();
	});
});
