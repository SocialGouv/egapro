import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchCompanyBySiren, trancheToWorkforce } from "../weez";

describe("trancheToWorkforce", () => {
	it("maps INSEE size-band codes to their lower bound", () => {
		expect(trancheToWorkforce("21")).toBe(50);
		expect(trancheToWorkforce("22")).toBe(100);
		expect(trancheToWorkforce("31")).toBe(200);
		expect(trancheToWorkforce("32")).toBe(250);
		expect(trancheToWorkforce("53")).toBe(10000);
	});

	it("returns null for non-employer, unknown or empty codes", () => {
		expect(trancheToWorkforce("NN")).toBeNull();
		expect(trancheToWorkforce("99")).toBeNull();
		expect(trancheToWorkforce(null)).toBeNull();
	});
});

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
						activiteprincipalenaf25unitelegale: "6202A",
						nomenclatureactiviteprincipalelibelleunitelegale:
							"Conseil en systèmes et logiciels informatiques",
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
			nafLabel: "Conseil en systèmes et logiciels informatiques",
			region: "Île-de-France",
			departmentCode: "75",
			departmentLabel: "Paris",
			workforce: 256,
			statutDiffusion: "O",
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
						activiteprincipalenaf25unitelegale: null,
						nomenclatureactiviteprincipalelibelleunitelegale: null,
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
			nafLabel: null,
			region: null,
			departmentCode: null,
			departmentLabel: null,
			workforce: 50,
			statutDiffusion: "N",
		});
	});

	it("keeps region/department for a non-diffusible company while masking the address", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				content: [
					{
						siren: "111222333",
						denominationunitelegale: null,
						raisonsociale: null,
						activiteprincipalenaf25unitelegale: "6202A",
						nomenclatureactiviteprincipalelibelleunitelegale: "Conseil",
						effectiftotal: 50,
						numerovoie: "5",
						typevoie: "RUE",
						libellevoie: "SECRETE",
						codepostal: "33000",
						libellecommune: "BORDEAUX",
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
			nafLabel: null,
			region: "Nouvelle-Aquitaine",
			departmentCode: "33",
			departmentLabel: "Gironde",
			workforce: 50,
			statutDiffusion: "N",
		});
	});

	it("falls back to the effectif band when effectiftotal is null", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				content: [
					{
						siren: "130025265",
						denominationunitelegale:
							"DIRECTION INTERMINISTERIELLE DU NUMERIQUE",
						raisonsociale: null,
						activiteprincipalenaf25unitelegale: "8411Z",
						nomenclatureactiviteprincipalelibelleunitelegale:
							"Administration publique générale",
						effectiftotal: null,
						trancheeffectifsunitelegale: "32",
						numerovoie: null,
						typevoie: null,
						libellevoie: null,
						codepostal: "75007",
						libellecommune: "PARIS",
						statutdiffusionunitelegale: "O",
					},
				],
				totalElements: 1,
			}),
		});

		const result = await fetchCompanyBySiren("130025265");

		expect(result?.workforce).toBe(250);
	});

	it("prefers the exact effectiftotal over the effectif band", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				content: [
					{
						siren: "451678973",
						denominationunitelegale: "CASTORAMA FRANCE",
						raisonsociale: null,
						activiteprincipalenaf25unitelegale: "4759A",
						nomenclatureactiviteprincipalelibelleunitelegale: null,
						effectiftotal: 12148,
						trancheeffectifsunitelegale: "53",
						numerovoie: null,
						typevoie: null,
						libellevoie: null,
						codepostal: null,
						libellecommune: null,
						statutdiffusionunitelegale: "O",
					},
				],
				totalElements: 1,
			}),
		});

		const result = await fetchCompanyBySiren("451678973");

		expect(result?.workforce).toBe(12148);
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
						activiteprincipalenaf25unitelegale: "7022Z",
						nomenclatureactiviteprincipalelibelleunitelegale:
							"Conseil pour les affaires et autres conseils de gestion",
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
			nafLabel: "Conseil pour les affaires et autres conseils de gestion",
			region: "Auvergne-Rhône-Alpes",
			departmentCode: "69",
			departmentLabel: "Rhône",
			workforce: null,
			statutDiffusion: "O",
		});
	});

	it("defaults statutDiffusion to null when the INSEE field is absent", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				content: [
					{
						siren: "999000111",
						denominationunitelegale: "Delta SA",
						raisonsociale: null,
						activiteprincipalenaf25unitelegale: "6202A",
						nomenclatureactiviteprincipalelibelleunitelegale: "Conseil",
						effectiftotal: 42,
						numerovoie: null,
						typevoie: null,
						libellevoie: null,
						codepostal: "75001",
						libellecommune: "PARIS",
					},
				],
				totalElements: 1,
			}),
		});

		const result = await fetchCompanyBySiren("999000111");

		// Absent statut is treated as diffusible: name/address are kept
		expect(result?.statutDiffusion).toBeNull();
		expect(result?.name).toBe("Delta SA");
	});

	it("returns nafLabel null when the activity label is absent", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				content: [
					{
						siren: "777888999",
						denominationunitelegale: "Gamma SARL",
						raisonsociale: null,
						activiteprincipalenaf25unitelegale: "4321A",
						nomenclatureactiviteprincipalelibelleunitelegale: null,
						effectiftotal: 12,
						numerovoie: null,
						typevoie: null,
						libellevoie: null,
						codepostal: "33000",
						libellecommune: "BORDEAUX",
						statutdiffusionunitelegale: "O",
					},
				],
				totalElements: 1,
			}),
		});

		const result = await fetchCompanyBySiren("777888999");

		expect(result).toEqual({
			name: "Gamma SARL",
			address: "33000 BORDEAUX",
			nafCode: "4321A",
			nafLabel: null,
			region: "Nouvelle-Aquitaine",
			departmentCode: "33",
			departmentLabel: "Gironde",
			workforce: 12,
			statutDiffusion: "O",
		});
	});
});
