import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchCseBySiren } from "../suit";

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

	it("logs the status on a non-ok response, so a 404 reads as endpoint-not-open", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		fetchSpy.mockResolvedValueOnce({
			ok: false,
			status: 404,
		});

		const result = await fetchCseBySiren("000000000");

		expect(result).toBeNull();
		// Tells a missing endpoint apart from a certificate problem.
		expect(warnSpy).toHaveBeenCalledWith("[suit] CSE lookup: HTTP 404");
	});

	it("returns null and logs on network error", async () => {
		const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		fetchSpy.mockRejectedValueOnce(new Error("Network error"));

		const result = await fetchCseBySiren("123456789");

		expect(result).toBeNull();
		expect(errorSpy).toHaveBeenCalledWith(
			"[suit] CSE lookup failed",
			expect.any(Error),
		);
	});
});
