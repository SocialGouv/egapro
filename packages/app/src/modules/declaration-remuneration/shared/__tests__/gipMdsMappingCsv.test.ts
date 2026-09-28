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

	it("maps the 16 v3 quartile nb columns (source of truth for step 4)", () => {
		const annualNb: Array<[string, string]> = [
			["Quartile1_Rem_globale_annuelle_nb_F", "annualQuartile1WomenCount"],
			["Quartile2_Rem_globale_annuelle_nb_F", "annualQuartile2WomenCount"],
			["Quartile3_Rem_globale_annuelle_nb_F", "annualQuartile3WomenCount"],
			["Quartile4_Rem_globale_annuelle_nb_F", "annualQuartile4WomenCount"],
			["Quartile1_Rem_globale_annuelle_nb_H", "annualQuartile1MenCount"],
			["Quartile2_Rem_globale_annuelle_nb_H", "annualQuartile2MenCount"],
			["Quartile3_Rem_globale_annuelle_nb_H", "annualQuartile3MenCount"],
			["Quartile4_Rem_globale_annuelle_nb_H", "annualQuartile4MenCount"],
		];
		const hourlyNb: Array<[string, string]> = [
			["Quartile1_Taux_horaire_global_nb_F", "hourlyQuartile1WomenCount"],
			["Quartile2_Taux_horaire_global_nb_F", "hourlyQuartile2WomenCount"],
			["Quartile3_Taux_horaire_global_nb_F", "hourlyQuartile3WomenCount"],
			["Quartile4_Taux_horaire_global_nb_F", "hourlyQuartile4WomenCount"],
			["Quartile1_Taux_horaire_global_nb_H", "hourlyQuartile1MenCount"],
			["Quartile2_Taux_horaire_global_nb_H", "hourlyQuartile2MenCount"],
			["Quartile3_Taux_horaire_global_nb_H", "hourlyQuartile3MenCount"],
			["Quartile4_Taux_horaire_global_nb_H", "hourlyQuartile4MenCount"],
		];
		for (const [csvKey, schemaField] of [...annualNb, ...hourlyNb]) {
			expect(CSV_TO_SCHEMA_MAP[csvKey]).toBe(schemaField);
		}
	});

	it("maps the 12 de-accented v3 median headers (indicators C and D)", () => {
		const deAccented: Array<[string, string]> = [
			["Rem_globale_annuelle_mediane_ecart", "globalAnnualMedianGap"],
			["Rem_globale_annuelle_mediane_F", "globalAnnualMedianWomen"],
			["Rem_globale_annuelle_mediane_H", "globalAnnualMedianMen"],
			["Taux_horaire_global_median_ecart", "globalHourlyMedianGap"],
			["Taux_globale_annuelle_mediane_F", "globalHourlyMedianWomen"],
			["Taux_globale_annuelle_mediane_H", "globalHourlyMedianMen"],
			["Rem_variable_annuelle_mediane_ecart", "variableAnnualMedianGap"],
			["Rem_variable_annuelle_mediane_F", "variableAnnualMedianWomen"],
			["Rem_variable_annuelle_mediane_H", "variableAnnualMedianMen"],
			["Taux_horaire_variable_median_ecart", "variableHourlyMedianGap"],
			["Taux_horaire_variable_median_F", "variableHourlyMedianWomen"],
			["Taux_horaire_variable_median_H", "variableHourlyMedianMen"],
		];
		for (const [csvKey, schemaField] of deAccented) {
			expect(CSV_TO_SCHEMA_MAP[csvKey]).toBe(schemaField);
		}
	});

	it("no longer maps the 12 accented median headers", () => {
		const accented = [
			"Rem_globale_annuelle_médiane_ecart",
			"Rem_globale_annuelle_médiane_F",
			"Rem_globale_annuelle_médiane_H",
			"Taux_horaire_global_médian_ecart",
			"Taux_globale_annuelle_médiane_F",
			"Taux_globale_annuelle_médiane_H",
			"Rem_variable_annuelle_médiane_ecart",
			"Rem_variable_annuelle_médiane_F",
			"Rem_variable_annuelle_médiane_H",
			"Taux_horaire_variable_médian_ecart",
			"Taux_horaire_variable_médian_F",
			"Taux_horaire_variable_médian_H",
		];
		for (const csvKey of accented) {
			expect(CSV_TO_SCHEMA_MAP[csvKey]).toBeUndefined();
		}
	});

	it("maps confidence index columns", () => {
		expect(CSV_TO_SCHEMA_MAP.indice).toBe("confidenceIndex");
		expect(CSV_TO_SCHEMA_MAP.indice_nature_exo).toBe(
			"confidenceExoticContracts",
		);
	});

	it("contains expected number of mappings", () => {
		const keys = Object.keys(CSV_TO_SCHEMA_MAP);
		// SIREN + Effectif_RCD + 6 workforce + 12 mean + 12 median + 2 proportion
		// + 6 thresholds + 16 quartile proportions + 16 quartile nb + 14 confidence
		expect(keys.length).toBe(87);
	});
});
