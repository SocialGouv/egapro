import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cache = vi.hoisted(() => new Map<string, unknown>());

vi.mock("next/cache", () => ({
	unstable_cache:
		(fn: (siren: string) => Promise<boolean>) => async (siren: string) => {
			if (cache.has(siren)) return cache.get(siren);
			const result = await fn(siren);
			cache.set(siren, result);
			return result;
		},
}));

import { fetchCseBySiren } from "../suit";

describe("fetchCseBySiren", () => {
	const fetchSpy = vi.fn();

	beforeEach(() => {
		cache.clear();
		fetchSpy.mockReset();
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

	it("does not cache a failed lookup", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		fetchSpy
			.mockResolvedValueOnce({ ok: false, status: 404 })
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({ siren: "123456789", CSE: true }),
			});

		expect(await fetchCseBySiren("123456789")).toBeNull();
		expect(await fetchCseBySiren("123456789")).toBe(true);
		expect(fetchSpy).toHaveBeenCalledTimes(2);
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
