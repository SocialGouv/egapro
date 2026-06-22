import {
	EntrepriseServiceError,
	EntrepriseServiceNotFoundError,
} from "@api/core-domain/infra/services/IEntrepriseService";
import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { Siret } from "@common/core-domain/domain/valueObjects/Siret";
import { StatusCodes } from "http-status-codes";

import { RechercheEntrepriseService } from "../RechercheEntrepriseService";

const TEST_SIREN = "384964508";
const TEST_SIRET = "42480547100044";

function mockFetchOnce(body: unknown, init: Partial<Response> = {}) {
	global.fetch = jest.fn().mockResolvedValueOnce({
		ok: init.status ? init.status >= 200 && init.status < 300 : true,
		status: init.status ?? 200,
		json: async () => body,
		...init,
	} as Response);
}

function makeApiResult(overrides: Record<string, unknown> = {}) {
	return {
		siren: TEST_SIREN,
		nom_raison_sociale: "ACME SARL",
		nom_complet: "Acme SARL",
		activite_principale: "62.02A",
		caractere_employeur: "O",
		nature_juridique: "5710",
		date_creation: "2010-01-01",
		etat_administratif: "A",
		nombre_etablissements: 3,
		matching_etablissements: [
			{
				siret: TEST_SIRET,
				adresse: "1 rue test 75001 PARIS",
				code_postal: "75001",
				commune: "75101",
				libelle_commune: "PARIS 1",
				activite_principale: "62.02A",
				est_siege: true,
				etat_administratif: "A",
			},
		],
		siege: {
			siret: TEST_SIRET,
			adresse: "1 rue test 75001 PARIS",
			code_postal: "75001",
			commune: "75101",
			libelle_commune: "PARIS 1",
			activite_principale: "62.02A",
			est_siege: true,
			etat_administratif: "A",
		},
		complements: { liste_idcc: ["1486"] },
		...overrides,
	};
}

describe("RechercheEntrepriseService", () => {
	const service = new RechercheEntrepriseService();
	const siren = new Siren(TEST_SIREN);

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe("siren mapping — nom_complet fallback (ticket #3442)", () => {
		it("uses nom_raison_sociale when present", async () => {
			mockFetchOnce({
				results: [
					{
						siren: TEST_SIREN,
						nom_raison_sociale: "RAISON SOCIALE SARL",
						nom_complet: "x",
					},
				],
			});
			const entreprise = await service.siren(siren);
			expect(entreprise.simpleLabel).toBe("RAISON SOCIALE SARL");
		});

		it("falls back to nom_complet when nom_raison_sociale is missing", async () => {
			mockFetchOnce({
				results: [{ siren: TEST_SIREN, nom_complet: "Nom Complet Only" }],
			});
			const entreprise = await service.siren(siren);
			expect(entreprise.simpleLabel).toBe("Nom Complet Only");
		});

		it("falls back to nom_complet when nom_raison_sociale is empty string", async () => {
			mockFetchOnce({
				results: [
					{
						siren: TEST_SIREN,
						nom_raison_sociale: "",
						nom_complet: "Nom Complet Fallback",
					},
				],
			});
			const entreprise = await service.siren(siren);
			expect(entreprise.simpleLabel).toBe("Nom Complet Fallback");
		});

		it("returns empty simpleLabel when both names are missing", async () => {
			mockFetchOnce({ results: [{ siren: TEST_SIREN }] });
			const entreprise = await service.siren(siren);
			expect(entreprise.simpleLabel).toBe("");
		});
	});

	describe("siren — error handling", () => {
		it("injects a NON-DIFFUSIBLE placeholder when results is empty", async () => {
			mockFetchOnce({ results: [] });
			const entreprise = await service.siren(siren);
			expect(entreprise.simpleLabel).toBe("[NON-DIFFUSIBLE]");
			expect(entreprise.siren).toBe(TEST_SIREN);
		});

		it("throws EntrepriseServiceNotFoundError on 404", async () => {
			mockFetchOnce({}, { status: StatusCodes.NOT_FOUND });
			await expect(service.siren(siren)).rejects.toBeInstanceOf(
				EntrepriseServiceNotFoundError,
			);
		});

		it("throws EntrepriseServiceError on 500", async () => {
			mockFetchOnce({}, { status: StatusCodes.INTERNAL_SERVER_ERROR });
			await expect(service.siren(siren)).rejects.toBeInstanceOf(
				EntrepriseServiceError,
			);
		});
	});

	describe("siren — transient network retry", () => {
		const econnrefused = () => Object.assign(new TypeError("fetch failed"), { cause: { code: "ECONNREFUSED" } });

		it("retries a thrown network error and resolves on a later attempt", async () => {
			global.fetch = jest
				.fn()
				.mockRejectedValueOnce(econnrefused())
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({ results: [{ siren: TEST_SIREN, nom_raison_sociale: "ACME SARL" }] }),
				} as Response);

			const entreprise = await service.siren(siren);

			expect(entreprise.simpleLabel).toBe("ACME SARL");
			expect(global.fetch).toHaveBeenCalledTimes(2);
		});

		it("gives up after the max number of attempts and wraps the error", async () => {
			global.fetch = jest.fn().mockRejectedValue(econnrefused());

			await expect(service.siren(siren)).rejects.toBeInstanceOf(EntrepriseServiceError);
			expect(global.fetch).toHaveBeenCalledTimes(3);
		});

		it("does not retry on an HTTP error status", async () => {
			mockFetchOnce({}, { status: StatusCodes.INTERNAL_SERVER_ERROR });

			await expect(service.siren(siren)).rejects.toBeInstanceOf(EntrepriseServiceError);
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});

		it("does not retry a non-transient network error (e.g. DNS ENOTFOUND)", async () => {
			global.fetch = jest
				.fn()
				.mockRejectedValue(Object.assign(new TypeError("fetch failed"), { cause: { code: "ENOTFOUND" } }));

			await expect(service.siren(siren)).rejects.toBeInstanceOf(EntrepriseServiceError);
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});

		it("does not retry an aborted request", async () => {
			global.fetch = jest.fn().mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" }));

			await expect(service.siren(siren)).rejects.toBeInstanceOf(EntrepriseServiceError);
			expect(global.fetch).toHaveBeenCalledTimes(1);
		});

		it("retries an AggregateError whose sub-errors are transient (dual-stack)", async () => {
			global.fetch = jest
				.fn()
				.mockRejectedValueOnce(
					Object.assign(new TypeError("fetch failed"), { cause: { errors: [{ code: "ECONNREFUSED" }] } }),
				)
				.mockResolvedValueOnce({
					ok: true,
					status: 200,
					json: async () => ({ results: [{ siren: TEST_SIREN, nom_raison_sociale: "ACME SARL" }] }),
				} as Response);

			const entreprise = await service.siren(siren);

			expect(entreprise.simpleLabel).toBe("ACME SARL");
			expect(global.fetch).toHaveBeenCalledTimes(2);
		});
	});

	describe("search", () => {
		it("maps API results into Entreprise[]", async () => {
			mockFetchOnce({ results: [makeApiResult()] });
			const result = await service.search({ query: "acme" });
			expect(result).toHaveLength(1);
			expect(result[0]?.siren).toBe(TEST_SIREN);
			expect(result[0]?.label).toBe("Acme SARL");
			expect(result[0]?.simpleLabel).toBe("ACME SARL");
		});

		it("injects a NON-DIFFUSIBLE placeholder for SIREN queries with empty results", async () => {
			mockFetchOnce({ results: [] });
			const result = await service.search({ query: TEST_SIREN });
			expect(result).toHaveLength(1);
			expect(result[0]?.simpleLabel).toBe("[NON-DIFFUSIBLE]");
		});

		it("filters by employer=true to keep only declared employers", async () => {
			mockFetchOnce({
				results: [
					makeApiResult({ siren: "111111119", caractere_employeur: "O" }),
					makeApiResult({ siren: "222222226", caractere_employeur: "N" }),
				],
			});
			const result = await service.search({ query: "test", employer: true });
			expect(result.map((r) => r.siren)).toEqual(["111111119"]);
		});

		it("filters by open=true to keep only active companies", async () => {
			mockFetchOnce({
				results: [
					makeApiResult({ siren: "111111119", etat_administratif: "A" }),
					makeApiResult({ siren: "222222226", etat_administratif: "C" }),
				],
			});
			const result = await service.search({ query: "test", open: true });
			expect(result.map((r) => r.siren)).toEqual(["111111119"]);
		});

		it("sorts by descending number of etablissements when ranked=true", async () => {
			mockFetchOnce({
				results: [
					makeApiResult({ siren: "111111119", nombre_etablissements: 5 }),
					makeApiResult({ siren: "222222226", nombre_etablissements: 20 }),
				],
			});
			const result = await service.search({ query: "test", ranked: true });
			expect(result.map((r) => r.siren)).toEqual(["222222226", "111111119"]);
		});

		it("throws EntrepriseServiceNotFoundError on 404", async () => {
			mockFetchOnce({}, { status: StatusCodes.NOT_FOUND });
			await expect(service.search({ query: "x" })).rejects.toBeInstanceOf(
				EntrepriseServiceNotFoundError,
			);
		});

		it("throws EntrepriseServiceError on 500", async () => {
			mockFetchOnce({}, { status: StatusCodes.INTERNAL_SERVER_ERROR });
			await expect(service.search({ query: "x" })).rejects.toBeInstanceOf(
				EntrepriseServiceError,
			);
		});
	});

	describe("siret", () => {
		const siret = new Siret(TEST_SIRET);

		it("maps API result for a matching etablissement", async () => {
			mockFetchOnce({ results: [makeApiResult()] });
			const result = await service.siret(siret);
			expect(result.siret).toBe(TEST_SIRET);
			expect(result.siren).toBe(TEST_SIREN);
			expect(result.etablissementSiege).toBe(true);
		});

		it("throws EntrepriseServiceNotFoundError when results is empty", async () => {
			mockFetchOnce({ results: [] });
			await expect(service.siret(siret)).rejects.toBeInstanceOf(
				EntrepriseServiceNotFoundError,
			);
		});

		it("throws EntrepriseServiceNotFoundError when no matching_etablissements", async () => {
			mockFetchOnce({
				results: [makeApiResult({ matching_etablissements: [] })],
			});
			await expect(service.siret(siret)).rejects.toBeInstanceOf(
				EntrepriseServiceNotFoundError,
			);
		});

		it("throws EntrepriseServiceNotFoundError when no matching etablissement for the SIRET", async () => {
			mockFetchOnce({
				results: [
					makeApiResult({
						matching_etablissements: [{ siret: "00000000000000" }],
					}),
				],
			});
			await expect(service.siret(siret)).rejects.toBeInstanceOf(
				EntrepriseServiceNotFoundError,
			);
		});

		it("throws EntrepriseServiceNotFoundError on 404", async () => {
			mockFetchOnce({}, { status: StatusCodes.NOT_FOUND });
			await expect(service.siret(siret)).rejects.toBeInstanceOf(
				EntrepriseServiceNotFoundError,
			);
		});
	});
});
