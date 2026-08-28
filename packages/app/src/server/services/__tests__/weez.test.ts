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
		// The spy is shared across the describe: without a reset it keeps the
		// previous test's call history and queued responses, and any assertion
		// on a call index silently reads the wrong request.
		fetchSpy.mockReset();
		vi.stubGlobal("fetch", fetchSpy);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	/**
	 * Queues the head-office response of the conditional second call. Only a
	 * legal unit without a postal code triggers it.
	 */
	function mockHeadOffice(establishment: unknown) {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			json: async () => establishment,
		});
	}

	const NO_COUNTRY = {
		codepaysetrangeretablissement: null,
		libellepaysetrangeretablissement: null,
	};

	/** Queues the legal-unit response of the first call. */
	function mockLegalUnit(entity: {
		siren: string;
		codepostal: string | null;
		name?: string;
		statutdiffusionunitelegale?: string;
	}) {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				content: [
					{
						siren: entity.siren,
						denominationunitelegale: entity.name ?? "Alpha Solutions",
						raisonsociale: null,
						activiteprincipalenaf25unitelegale: "6202A",
						nomenclatureactiviteprincipalelibelleunitelegale:
							"Conseil en systèmes et logiciels informatiques",
						effectiftotal: 256,
						numerovoie: "12",
						typevoie: "RUE",
						libellevoie: "DES INNOVATEURS",
						codepostal: entity.codepostal,
						libellecommune: entity.codepostal ? "PARIS" : null,
						statutdiffusionunitelegale:
							entity.statutdiffusionunitelegale ?? "O",
					},
				],
				totalElements: 1,
			}),
		});
	}

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
			countryCode: null,
			countryLabel: "FRANCE",
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
		mockHeadOffice(NO_COUNTRY);

		const result = await fetchCompanyBySiren("111222333");

		expect(result).toEqual({
			name: "Entreprise non diffusible",
			address: null,
			nafCode: null,
			nafLabel: null,
			region: null,
			departmentCode: null,
			departmentLabel: null,
			countryCode: null,
			countryLabel: null,
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
			countryCode: null,
			countryLabel: "FRANCE",
			workforce: 50,
			statutDiffusion: "N",
		});
	});

	it("falls back to the effectif band for a non-diffusible company when effectiftotal is null", async () => {
		fetchSpy.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				content: [
					{
						siren: "222333444",
						denominationunitelegale: null,
						raisonsociale: null,
						activiteprincipalenaf25unitelegale: null,
						nomenclatureactiviteprincipalelibelleunitelegale: null,
						effectiftotal: null,
						trancheeffectifsunitelegale: "22",
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

		mockHeadOffice(NO_COUNTRY);

		const result = await fetchCompanyBySiren("222333444");

		expect(result?.workforce).toBe(100);
		expect(result?.statutDiffusion).toBe("N");
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

		mockHeadOffice(NO_COUNTRY);

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
			countryCode: null,
			countryLabel: "FRANCE",
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
			countryCode: null,
			countryLabel: "FRANCE",
			workforce: 12,
			statutDiffusion: "O",
		});
	});

	it("resolves FRANCE without calling the head office when a postal code is present (S1)", async () => {
		mockLegalUnit({ siren: "532847196", codepostal: "75011" });

		const result = await fetchCompanyBySiren("532847196");

		expect(result).toMatchObject({ countryCode: null, countryLabel: "FRANCE" });
		expect(fetchSpy).toHaveBeenCalledTimes(1);
	});

	it("reads the country off the head office when the legal unit has no postal code (S2)", async () => {
		mockLegalUnit({ siren: "987654321", codepostal: null });
		mockHeadOffice({
			codepaysetrangeretablissement: "99248",
			libellepaysetrangeretablissement: "QATAR",
		});

		const result = await fetchCompanyBySiren("987654321");

		expect(result).toMatchObject({
			countryCode: "99248",
			countryLabel: "QATAR",
		});

		const headOfficeUrl = fetchSpy.mock.calls[1]?.[0] as URL;
		expect(headOfficeUrl.href).toContain(
			"/public/v3/unitelegale/etablissementsiege",
		);
		expect(headOfficeUrl.searchParams.get("siren")).toBe("987654321");
	});

	it("reads the country off a paginated head-office envelope (S2)", async () => {
		mockLegalUnit({ siren: "987654321", codepostal: null });
		mockHeadOffice({
			content: [
				{
					codepaysetrangeretablissement: "99248",
					libellepaysetrangeretablissement: "QATAR",
				},
			],
		});

		const result = await fetchCompanyBySiren("987654321");

		expect(result).toMatchObject({
			countryCode: "99248",
			countryLabel: "QATAR",
		});
	});

	it("leaves the country unknown when the head-office call fails, without breaking the lookup (S3)", async () => {
		mockLegalUnit({ siren: "987654321", codepostal: null, name: "Gamma SARL" });
		fetchSpy.mockRejectedValueOnce(new Error("network down"));

		const result = await fetchCompanyBySiren("987654321");

		expect(result).toMatchObject({
			name: "Gamma SARL",
			countryCode: null,
			countryLabel: null,
		});
	});

	it("leaves the country unknown when the head office answers with an error status (S3)", async () => {
		mockLegalUnit({ siren: "987654321", codepostal: null });
		fetchSpy.mockResolvedValueOnce({
			ok: false,
			status: 503,
			statusText: "Service Unavailable",
		});

		const result = await fetchCompanyBySiren("987654321");

		expect(result).toMatchObject({ countryCode: null, countryLabel: null });
	});

	it("leaves the country unknown when the head office carries no country (S3)", async () => {
		mockLegalUnit({ siren: "987654321", codepostal: null });
		mockHeadOffice(NO_COUNTRY);

		const result = await fetchCompanyBySiren("987654321");

		expect(result).toMatchObject({ countryCode: null, countryLabel: null });
	});

	it("leaves the country unknown when the head office answers with no row at all (S3)", async () => {
		mockLegalUnit({ siren: "987654321", codepostal: null });
		mockHeadOffice(null);

		const result = await fetchCompanyBySiren("987654321");

		expect(result).toMatchObject({ countryCode: null, countryLabel: null });
	});

	it.each([
		["a code without a label", "99248", null],
		["a label without a code", null, "QATAR"],
	])("leaves the country unknown rather than half-filled when the head office returns %s (S3)", async (_case, code, label) => {
		mockLegalUnit({ siren: "987654321", codepostal: null });
		mockHeadOffice({
			codepaysetrangeretablissement: code,
			libellepaysetrangeretablissement: label,
		});

		const result = await fetchCompanyBySiren("987654321");

		expect(result).toMatchObject({ countryCode: null, countryLabel: null });
	});

	it("drops an over-long country code rather than truncating it into another country", async () => {
		mockLegalUnit({ siren: "987654321", codepostal: null });
		mockHeadOffice({
			codepaysetrangeretablissement: "992480",
			libellepaysetrangeretablissement: "QATAR",
		});

		const result = await fetchCompanyBySiren("987654321");

		expect(result).toMatchObject({ countryCode: null, countryLabel: null });
	});

	it("clamps an over-long country label to the column width", async () => {
		mockLegalUnit({ siren: "987654321", codepostal: null });
		mockHeadOffice({
			codepaysetrangeretablissement: "99248",
			libellepaysetrangeretablissement: "Q".repeat(300),
		});

		const result = await fetchCompanyBySiren("987654321");

		expect(result?.countryCode).toBe("99248");
		expect(result?.countryLabel).toBe("Q".repeat(255));
	});

	it("keeps FRANCE on a non-diffusible company while address and NAF stay masked (S4)", async () => {
		mockLegalUnit({
			siren: "111222333",
			codepostal: "33000",
			statutdiffusionunitelegale: "N",
		});

		const result = await fetchCompanyBySiren("111222333");

		expect(result).toMatchObject({
			address: null,
			nafCode: null,
			nafLabel: null,
			departmentCode: "33",
			countryCode: null,
			countryLabel: "FRANCE",
		});
	});
});
