import { describe, expect, it, vi } from "vitest";

import { fetchGipCsv, parseGipCsv } from "../gipMds";

const VALID_CSV = [
	"destinataire;projet;horodatage;date_debut;date_fin;nb_lignes",
	"foo;bar;2026-03-01;2026-01-01;2026-12-31;2",
	"SIREN;Effectif_RCD;Rem_globale_annuelle_moyenne_F;Rem_globale_annuelle_moyenne_H",
	"123456789;200;35000,50;38000,25",
	"987654321;150;32000,00;34000,75",
].join("\n");

describe("parseGipCsv", () => {
	it("parses valid CSV into metadata and rows", () => {
		const result = parseGipCsv(VALID_CSV);

		expect(result.metadata).toEqual({
			periodStart: "2026-01-01",
			periodEnd: "2026-12-31",
			expectedRows: 2,
		});

		expect(result.rows).toHaveLength(2);
		expect(result.rows[0]).toEqual({
			siren: "123456789",
			workforceEma: "200",
			globalAnnualMeanWomen: "35000.50",
			globalAnnualMeanMen: "38000.25",
		});
		expect(result.rows[1]).toEqual({
			siren: "987654321",
			workforceEma: "150",
			globalAnnualMeanWomen: "32000.00",
			globalAnnualMeanMen: "34000.75",
		});
	});

	it("throws on CSV with fewer than 4 lines", () => {
		const shortCsv = [
			"destinataire;projet;horodatage;date_debut;date_fin;nb_lignes",
			"foo;bar;2026-03-01;2026-01-01;2026-12-31;0",
			"SIREN;Effectif_RCD",
		].join("\n");

		expect(() => parseGipCsv(shortCsv)).toThrow(
			"Invalid GIP CSV: expected at least 4 lines",
		);
	});

	it("skips empty data rows", () => {
		const csvWithEmpty = [
			"destinataire;projet;horodatage;date_debut;date_fin;nb_lignes",
			"foo;bar;2026-03-01;2026-01-01;2026-12-31;1",
			"SIREN;Effectif_RCD;Rem_globale_annuelle_moyenne_F;Rem_globale_annuelle_moyenne_H",
			"",
			"   ",
			"123456789;200;35000,50;38000,25",
		].join("\n");

		const result = parseGipCsv(csvWithEmpty);
		expect(result.rows).toHaveLength(1);
		expect(result.rows[0]?.siren).toBe("123456789");
	});

	it("maps CSV columns to schema fields using CSV_TO_SCHEMA_MAP", () => {
		const csv = [
			"destinataire;projet;horodatage;date_debut;date_fin;nb_lignes",
			"foo;bar;2026-03-01;2026-01-01;2026-12-31;1",
			"SIREN;Effectif_RCD;Taux_horaire_global_moyen_F;Taux_horaire_global_moyen_H;indice",
			"111222333;300;22,50;24,75;0,85",
		].join("\n");

		const result = parseGipCsv(csv);
		expect(result.rows).toHaveLength(1);

		const row = result.rows[0];
		expect(row).toHaveProperty("siren", "111222333");
		expect(row).toHaveProperty("workforceEma", "300");
		expect(row).toHaveProperty("globalHourlyMeanWomen", "22.50");
		expect(row).toHaveProperty("globalHourlyMeanMen", "24.75");
		expect(row).toHaveProperty("confidenceIndex", "0.85");
	});

	it("converts French decimal commas to dots", () => {
		const csv = [
			"destinataire;projet;horodatage;date_debut;date_fin;nb_lignes",
			"foo;bar;2026-03-01;2026-01-01;2026-12-31;1",
			"SIREN;Rem_globale_annuelle_moyenne_F;Rem_globale_annuelle_moyenne_H",
			"123456789;12345,67;23456,78",
		].join("\n");

		const result = parseGipCsv(csv);
		expect(result.rows[0]).toHaveProperty("globalAnnualMeanWomen", "12345.67");
		expect(result.rows[0]).toHaveProperty("globalAnnualMeanMen", "23456.78");
	});

	it("skips rows without a siren", () => {
		const csv = [
			"destinataire;projet;horodatage;date_debut;date_fin;nb_lignes",
			"foo;bar;2026-03-01;2026-01-01;2026-12-31;1",
			"SIREN;Effectif_RCD",
			";200",
		].join("\n");

		const result = parseGipCsv(csv);
		expect(result.rows).toHaveLength(0);
	});

	it("ignores CSV columns not present in CSV_TO_SCHEMA_MAP", () => {
		const csv = [
			"destinataire;projet;horodatage;date_debut;date_fin;nb_lignes",
			"foo;bar;2026-03-01;2026-01-01;2026-12-31;1",
			"SIREN;UNKNOWN_COLUMN;Effectif_RCD",
			"123456789;some_value;200",
		].join("\n");

		const result = parseGipCsv(csv);
		expect(result.rows).toHaveLength(1);
		expect(result.rows[0]).not.toHaveProperty("UNKNOWN_COLUMN");
		expect(result.rows[0]).toHaveProperty("siren", "123456789");
		expect(result.rows[0]).toHaveProperty("workforceEma", "200");
	});
});

describe("fetchGipCsv", () => {
	it("returns text content from a successful response", async () => {
		const mockResponse = {
			ok: true,
			text: vi.fn().mockResolvedValue(VALID_CSV),
			status: 200,
			statusText: "OK",
		};
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

		const result = await fetchGipCsv("https://example.com/gip.csv");

		expect(result).toBe(VALID_CSV);
		expect(fetch).toHaveBeenCalledWith("https://example.com/gip.csv", {
			signal: expect.any(AbortSignal),
		});

		vi.unstubAllGlobals();
	});

	it("throws on non-OK response", async () => {
		const mockResponse = {
			ok: false,
			status: 404,
			statusText: "Not Found",
		};
		vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

		await expect(fetchGipCsv("https://example.com/gip.csv")).rejects.toThrow(
			"GIP MDS API error: 404 Not Found",
		);

		vi.unstubAllGlobals();
	});
});
