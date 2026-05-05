import { describe, expect, it } from "vitest";
import { CSV_TO_SCHEMA_MAP } from "../gipMdsMapping";

describe("CSV_TO_SCHEMA_MAP", () => {
	it("maps SIREN column to siren field", () => {
		expect(CSV_TO_SCHEMA_MAP.SIREN).toBe("siren");
	});

	it("maps workforce columns", () => {
		expect(CSV_TO_SCHEMA_MAP.Effectif_RCD).toBe("workforceEma");
		expect(CSV_TO_SCHEMA_MAP.Effectif_H_rem_annuelle_globale).toBe(
			"menCountAnnualGlobal",
		);
		expect(CSV_TO_SCHEMA_MAP.Effectif_F_rem_annuelle_globale).toBe(
			"womenCountAnnualGlobal",
		);
	});

	it("maps indicator A columns (global mean)", () => {
		expect(CSV_TO_SCHEMA_MAP.Rem_globale_annuelle_moyenne_ecart).toBe(
			"globalAnnualMeanGap",
		);
		expect(CSV_TO_SCHEMA_MAP.Rem_globale_annuelle_moyenne_F).toBe(
			"globalAnnualMeanWomen",
		);
		expect(CSV_TO_SCHEMA_MAP.Rem_globale_annuelle_moyenne_H).toBe(
			"globalAnnualMeanMen",
		);
	});

	it("maps quartile columns (indicator F)", () => {
		expect(CSV_TO_SCHEMA_MAP.Seuil_Q1_Rem_globale).toBe(
			"annualQuartileThreshold1",
		);
		expect(CSV_TO_SCHEMA_MAP.Quartile1_Rem_globale_annuelle_proportion_F).toBe(
			"annualQuartile1ProportionWomen",
		);
	});

	it("maps confidence index columns", () => {
		expect(CSV_TO_SCHEMA_MAP.indice).toBe("confidenceIndex");
		expect(CSV_TO_SCHEMA_MAP.indice_nature_exo).toBe(
			"confidenceExoticContracts",
		);
	});

	it("contains expected number of mappings", () => {
		const keys = Object.keys(CSV_TO_SCHEMA_MAP);
		// 7 workforce + 24 indicator + 2 proportion + 16 quartile annual + 16 quartile hourly + 14 confidence + SIREN
		expect(keys.length).toBeGreaterThan(50);
	});
});
