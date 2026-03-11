import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchCompanyBySiren } from "../weez";

describe("fetchCompanyBySiren", () => {
	const fetchSpy = vi.fn();

	beforeEach(() => {
		vi.stubGlobal("fetch", fetchSpy);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns company info for a diffusible company", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				content: [
					{
						siren: "532847196",
						denominationunitelegale: "Alpha Solutions",
						raisonsociale: null,
						activiteprincipaleunitelegale: "6202A",
						effectiftotal: 256,
						numerovoie: "12",
						typevoie: "RUE",
						libellevoie: "DES INNOVATEURS",
						codepostal: "75011",
						libellecommune: "PARIS",
						statutdiffusionunitelegale: "O",
					},
				],
				totalElements: 1,
			}),
		});

		const result = await fetchCompanyBySiren("532847196");

		expect(result).toEqual({
			name: "Alpha Solutions",
			address: "12 RUE DES INNOVATEURS, 75011 PARIS",
			nafCode: "6202A",
			workforce: 256,
		});

		const calledUrl = fetchSpy.mock.calls[0]?.[0] as URL;
		expect(calledUrl.href).toContain("/public/v3/unitelegale/findbysiren");
		expect(calledUrl.searchParams.get("siren")).toBe("532847196");
		expect(calledUrl.searchParams.get("inclure_non_diffusibles")).toBe("true");
	});

	it("returns limited info for non-diffusible company", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				content: [
					{
						siren: "111222333",
						denominationunitelegale: null,
						raisonsociale: null,
						activiteprincipaleunitelegale: null,
						effectiftotal: 50,
						numerovoie: null,
						typevoie: null,
						libellevoie: null,
						codepostal: null,
						libellecommune: null,
						statutdiffusionunitelegale: "N",
					},
				],
				totalElements: 1,
			}),
		});

		const result = await fetchCompanyBySiren("111222333");

		expect(result).toEqual({
			name: "Entreprise non diffusible",
			address: null,
			nafCode: null,
			workforce: 50,
		});
	});

	it("returns null when no company found", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				content: [],
				totalElements: 0,
			}),
		});

		const result = await fetchCompanyBySiren("000000000");

		expect(result).toBeNull();
	});

	it("throws on API error", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: false,
			status: 500,
			statusText: "Internal Server Error",
		});

		await expect(fetchCompanyBySiren("123456789")).rejects.toThrow(
			"Weez API error: 500 Internal Server Error",
		);
	});

	it("uses raisonsociale as fallback when denominationunitelegale is null", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				content: [
					{
						siren: "444555666",
						denominationunitelegale: null,
						raisonsociale: "Société Beta",
						activiteprincipaleunitelegale: "7022Z",
						effectiftotal: null,
						numerovoie: null,
						typevoie: null,
						libellevoie: null,
						codepostal: "69001",
						libellecommune: "LYON",
						statutdiffusionunitelegale: "O",
					},
				],
				totalElements: 1,
			}),
		});

		const result = await fetchCompanyBySiren("444555666");

		expect(result).toEqual({
			name: "Société Beta",
			address: "69001 LYON",
			nafCode: "7022Z",
			workforce: null,
		});
	});
});
