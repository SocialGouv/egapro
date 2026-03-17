import type { gipMdsData } from "~/server/db/schema";

/**
 * GIP MDS data row type inferred from the Drizzle schema.
 * All numeric fields come back as `string | null` from Drizzle.
 */
export type GipMdsRow = typeof gipMdsData.$inferSelect;

/** Quartile data computed from GIP proportions + workforce totals. */
export type GipQuartileData = {
	/** 4 thresholds, one per quartile (lower bound of each quartile group). */
	thresholds: [string | null, string | null, string | null, string | null];
	/** Integer women count per quartile, derived from proportion × total/4. */
	womenCounts: [number | null, number | null, number | null, number | null];
	/** Integer men count per quartile, derived from proportion × total/4. */
	menCounts: [number | null, number | null, number | null, number | null];
};

/**
 * Pre-filled form data derived from GIP MDS indicators.
 * Each step maps to the corresponding form step structure.
 * `null` values mean the GIP file had no data for that field.
 */
export type GipPrefillData = {
	/** Step 1 — Workforce (physical headcount for annual global remuneration) */
	step1: {
		totalWomen: number | null;
		totalMen: number | null;
	};
	/** Step 2 — Pay gap (Indicator A mean + Indicator C median) */
	step2: {
		annualMeanWomen: string | null;
		annualMeanMen: string | null;
		hourlyMeanWomen: string | null;
		hourlyMeanMen: string | null;
		annualMedianWomen: string | null;
		annualMedianMen: string | null;
		hourlyMedianWomen: string | null;
		hourlyMedianMen: string | null;
	};
	/** Step 3 — Variable pay (Indicator B mean + Indicator D median + Indicator E beneficiary counts) */
	step3: {
		annualMeanWomen: string | null;
		annualMeanMen: string | null;
		hourlyMeanWomen: string | null;
		hourlyMeanMen: string | null;
		annualMedianWomen: string | null;
		annualMedianMen: string | null;
		hourlyMedianWomen: string | null;
		hourlyMedianMen: string | null;
		/** Number of women benefiting from variable pay (integer from GIP workforce column). */
		beneficiaryCountWomen: number | null;
		/** Number of men benefiting from variable pay (integer from GIP workforce column). */
		beneficiaryCountMen: number | null;
	};
	/** Step 4 — Quartile distribution (Indicator F), with counts computed from proportions. */
	step4: {
		annual: GipQuartileData;
		hourly: GipQuartileData;
	};
	/** Confidence index (0-1, for internal DGT use) */
	confidenceIndex: string | null;
	/** End of the data collection period (e.g. "2026-12-31"), used for "Source : DSN" display. */
	periodEnd: string | null;
};

/**
 * Maps a GIP MDS database row to the pre-fill structure consumed by the form.
 * Returns `null` if no GIP data is provided.
 */
export function mapGipToFormData(row: GipMdsRow | null): GipPrefillData | null {
	if (!row) return null;

	const totalWomen = toInt(row.womenCountAnnualGlobal);
	const totalMen = toInt(row.menCountAnnualGlobal);

	return {
		step1: {
			totalWomen,
			totalMen,
		},
		step2: {
			annualMeanWomen: row.globalAnnualMeanWomen,
			annualMeanMen: row.globalAnnualMeanMen,
			hourlyMeanWomen: row.globalHourlyMeanWomen,
			hourlyMeanMen: row.globalHourlyMeanMen,
			annualMedianWomen: row.globalAnnualMedianWomen,
			annualMedianMen: row.globalAnnualMedianMen,
			hourlyMedianWomen: row.globalHourlyMedianWomen,
			hourlyMedianMen: row.globalHourlyMedianMen,
		},
		step3: {
			annualMeanWomen: row.variableAnnualMeanWomen,
			annualMeanMen: row.variableAnnualMeanMen,
			hourlyMeanWomen: row.variableHourlyMeanWomen,
			hourlyMeanMen: row.variableHourlyMeanMen,
			annualMedianWomen: row.variableAnnualMedianWomen,
			annualMedianMen: row.variableAnnualMedianMen,
			hourlyMedianWomen: row.variableHourlyMedianWomen,
			hourlyMedianMen: row.variableHourlyMedianMen,
			beneficiaryCountWomen: toInt(row.womenCountAnnualVariable),
			beneficiaryCountMen: toInt(row.menCountAnnualVariable),
		},
		step4: {
			annual: buildQuartileData(
				totalWomen,
				totalMen,
				[
					row.annualQuartileThreshold1,
					row.annualQuartileThreshold2,
					row.annualQuartileThreshold3,
					row.annualQuartileThreshold4,
				],
				[
					row.annualQuartile1ProportionWomen,
					row.annualQuartile2ProportionWomen,
					row.annualQuartile3ProportionWomen,
					row.annualQuartile4ProportionWomen,
				],
				[
					row.annualQuartile1ProportionMen,
					row.annualQuartile2ProportionMen,
					row.annualQuartile3ProportionMen,
					row.annualQuartile4ProportionMen,
				],
			),
			hourly: buildQuartileData(
				toInt(row.womenCountHourlyGlobal),
				toInt(row.menCountHourlyGlobal),
				[
					row.hourlyQuartileThreshold1,
					row.hourlyQuartileThreshold2,
					row.hourlyQuartileThreshold3,
					row.hourlyQuartileThreshold4,
				],
				[
					row.hourlyQuartile1ProportionWomen,
					row.hourlyQuartile2ProportionWomen,
					row.hourlyQuartile3ProportionWomen,
					row.hourlyQuartile4ProportionWomen,
				],
				[
					row.hourlyQuartile1ProportionMen,
					row.hourlyQuartile2ProportionMen,
					row.hourlyQuartile3ProportionMen,
					row.hourlyQuartile4ProportionMen,
				],
			),
		},
		confidenceIndex: row.confidenceIndex,
		periodEnd: row.periodEnd,
	};
}

/**
 * CSV column name to schema field mapping.
 * Maps the short label from the GIP MDS CSV header to the Drizzle column name.
 */
export const CSV_TO_SCHEMA_MAP: Record<string, keyof GipMdsRow> = {
	SIREN: "siren",
	Effectif_RCD: "workforceEma",
	Effectif_H_rem_annuelle_globale: "menCountAnnualGlobal",
	Effectif_F_rem_annuelle_globale: "womenCountAnnualGlobal",
	Effectif_H_taux_horaire_global: "menCountHourlyGlobal",
	Effectif_F_taux_horaire_global: "womenCountHourlyGlobal",
	Effectif_H_rem_annuelle_variable: "menCountAnnualVariable",
	Effectif_F_rem_annuelle_variable: "womenCountAnnualVariable",
	Rem_globale_annuelle_moyenne_ecart: "globalAnnualMeanGap",
	Rem_globale_annuelle_moyenne_F: "globalAnnualMeanWomen",
	Rem_globale_annuelle_moyenne_H: "globalAnnualMeanMen",
	Taux_horaire_global_moyen_ecart: "globalHourlyMeanGap",
	Taux_horaire_global_moyen_F: "globalHourlyMeanWomen",
	Taux_horaire_global_moyen_H: "globalHourlyMeanMen",
	Rem_variable_annuelle_moyenne_ecart: "variableAnnualMeanGap",
	Rem_variable_annuelle_moyenne_F: "variableAnnualMeanWomen",
	Rem_variable_annuelle_moyenne_H: "variableAnnualMeanMen",
	Taux_horaire_variable_moyen_ecart: "variableHourlyMeanGap",
	Taux_horaire_variable_moyen_F: "variableHourlyMeanWomen",
	Taux_horaire_variable_moyen_H: "variableHourlyMeanMen",
	Rem_globale_annuelle_médiane_ecart: "globalAnnualMedianGap",
	Rem_globale_annuelle_médiane_F: "globalAnnualMedianWomen",
	Rem_globale_annuelle_médiane_H: "globalAnnualMedianMen",
	Taux_horaire_global_médian_ecart: "globalHourlyMedianGap",
	Taux_globale_annuelle_médiane_F: "globalHourlyMedianWomen",
	Taux_globale_annuelle_médiane_H: "globalHourlyMedianMen",
	Rem_variable_annuelle_médiane_ecart: "variableAnnualMedianGap",
	Rem_variable_annuelle_médiane_F: "variableAnnualMedianWomen",
	Rem_variable_annuelle_médiane_H: "variableAnnualMedianMen",
	Taux_horaire_variable_médian_ecart: "variableHourlyMedianGap",
	Taux_horaire_variable_médian_F: "variableHourlyMedianWomen",
	Taux_horaire_variable_médian_H: "variableHourlyMedianMen",
	Proportion_variable_F: "variableProportionWomen",
	Proportion_variable_H: "variableProportionMen",
	Seuil_Q1_Rem_globale: "annualQuartileThreshold1",
	Seuil_Q2_Rem_globale: "annualQuartileThreshold2",
	Seuil_Q3_Rem_globale: "annualQuartileThreshold3",
	Seuil_Q4_Rem_globale: "annualQuartileThreshold4",
	Quartile1_Rem_globale_annuelle_proportion_F: "annualQuartile1ProportionWomen",
	Quartile2_Rem_globale_annuelle_proportion_F: "annualQuartile2ProportionWomen",
	Quartile3_Rem_globale_annuelle_proportion_F: "annualQuartile3ProportionWomen",
	Quartile4_Rem_globale_annuelle_proportion_F: "annualQuartile4ProportionWomen",
	Quartile1_Rem_globale_annuelle_proportion_H: "annualQuartile1ProportionMen",
	Quartile2_Rem_globale_annuelle_proportion_H: "annualQuartile2ProportionMen",
	Quartile3_Rem_globale_annuelle_proportion_H: "annualQuartile3ProportionMen",
	Quartile4_Rem_globale_annuelle_proportion_H: "annualQuartile4ProportionMen",
	Seuil_Q1_Taux_horaire_global: "hourlyQuartileThreshold1",
	Seuil_Q2_Taux_horaire_global: "hourlyQuartileThreshold2",
	Seuil_Q3_Taux_horaire_global: "hourlyQuartileThreshold3",
	Seuil_Q4_Taux_horaire_global: "hourlyQuartileThreshold4",
	Quartile1_Taux_horaire_global_proportion_F: "hourlyQuartile1ProportionWomen",
	Quartile2_Taux_horaire_global_proportion_F: "hourlyQuartile2ProportionWomen",
	Quartile3_Taux_horaire_global_proportion_F: "hourlyQuartile3ProportionWomen",
	Quartile4_Taux_horaire_global_proportion_F: "hourlyQuartile4ProportionWomen",
	Quartile1_Taux_horaire_global_proportion_H: "hourlyQuartile1ProportionMen",
	Quartile2_Taux_horaire_global_proportion_H: "hourlyQuartile2ProportionMen",
	Quartile3_Taux_horaire_global_proportion_H: "hourlyQuartile3ProportionMen",
	Quartile4_Taux_horaire_global_proportion_H: "hourlyQuartile4ProportionMen",
	indice: "confidenceIndex",
	indice_nature_exo: "confidenceExoticContracts",
	indice_unite: "confidenceUnitMeasure",
	indice_ratio_suspensions: "confidenceSuspensionRatio",
	indice_suspensions_longues: "confidenceLongSuspensions",
	indice_suspensions_sans_fin: "confidenceNoEndSuspensions",
	indice_ratio_arrets: "confidenceSickLeaveRatio",
	indice_arrets_longs: "confidenceLongSickLeave",
	indice_arrets_0: "confidenceNoSickLeave",
	indice_quotite250: "confidenceQuota250",
	indice_quotite0: "confidenceQuota0",
	indice_sup_annee_civile: "confidenceMultiYear",
	indice_ratio_FP: "confidenceFpRatio",
	indice_rem_extremes: "confidenceExtremeRemuneration",
	indice_taux_extremes: "confidenceExtremeRate",
};

/** Parse a Drizzle numeric string to a rounded integer, or null. */
function toInt(value: string | null): number | null {
	if (value === null) return null;
	const parsed = Number.parseFloat(value);
	return Number.isNaN(parsed) ? null : Math.round(parsed);
}

/**
 * Convert a GIP proportion (0-1) to an integer headcount.
 * Each quartile contains ~total/4 people; the proportion gives the gender split.
 * Formula: count = round(proportion × quartileSize).
 */
function proportionToCount(
	proportion: string | null,
	quartileSize: number,
): number | null {
	if (proportion === null) return null;
	const p = Number.parseFloat(proportion);
	if (Number.isNaN(p)) return null;
	return Math.round(p * quartileSize);
}

/**
 * Build quartile data from GIP proportions + workforce totals.
 * The total workforce for each gender is split into 4 quartiles of ~equal size.
 */
function buildQuartileData(
	totalWomen: number | null,
	totalMen: number | null,
	thresholds: [string | null, string | null, string | null, string | null],
	womenProportions: [
		string | null,
		string | null,
		string | null,
		string | null,
	],
	menProportions: [string | null, string | null, string | null, string | null],
): GipQuartileData {
	const totalAll = (totalWomen ?? 0) + (totalMen ?? 0);
	const quartileSize = totalAll > 0 ? Math.round(totalAll / 4) : 0;

	return {
		thresholds,
		womenCounts: [
			proportionToCount(womenProportions[0], quartileSize),
			proportionToCount(womenProportions[1], quartileSize),
			proportionToCount(womenProportions[2], quartileSize),
			proportionToCount(womenProportions[3], quartileSize),
		],
		menCounts: [
			proportionToCount(menProportions[0], quartileSize),
			proportionToCount(menProportions[1], quartileSize),
			proportionToCount(menProportions[2], quartileSize),
			proportionToCount(menProportions[3], quartileSize),
		],
	};
}
