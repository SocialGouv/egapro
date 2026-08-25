import type { gipMdsData } from "~/server/db/schema";

/**
 * GIP MDS data row type inferred from the Drizzle schema.
 * All numeric fields come back as `string | null` from Drizzle.
 */
export type GipMdsRow = typeof gipMdsData.$inferSelect;

/** Quartile data read from the GIP `nb_F`/`nb_H` columns. */
export type GipQuartileData = {
	/** 3 thresholds for Q1-Q3 (lower bound); Q4 has no threshold in the GIP model. */
	thresholds: [string | null, string | null, string | null];
	/** Integer women count per quartile, read verbatim from the GIP `nb_F` columns. */
	womenCounts: [number | null, number | null, number | null, number | null];
	/** Integer men count per quartile, read verbatim from the GIP `nb_H` columns. */
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
		annualMeanGap: string | null;
		hourlyMeanWomen: string | null;
		hourlyMeanMen: string | null;
		hourlyMeanGap: string | null;
		annualMedianWomen: string | null;
		annualMedianMen: string | null;
		annualMedianGap: string | null;
		hourlyMedianWomen: string | null;
		hourlyMedianMen: string | null;
		hourlyMedianGap: string | null;
	};
	/** Step 3 — Variable pay (Indicator B mean + Indicator D median + Indicator E beneficiary counts) */
	step3: {
		annualMeanWomen: string | null;
		annualMeanMen: string | null;
		annualMeanGap: string | null;
		hourlyMeanWomen: string | null;
		hourlyMeanMen: string | null;
		hourlyMeanGap: string | null;
		annualMedianWomen: string | null;
		annualMedianMen: string | null;
		annualMedianGap: string | null;
		hourlyMedianWomen: string | null;
		hourlyMedianMen: string | null;
		hourlyMedianGap: string | null;
		/** Number of women benefiting from variable pay (integer from GIP workforce column). */
		beneficiaryCountWomen: number | null;
		/** Number of men benefiting from variable pay (integer from GIP workforce column). */
		beneficiaryCountMen: number | null;
	};
	/** Step 4 — Quartile distribution (Indicator F), counts read from the GIP `nb` columns. */
	step4: {
		annual: GipQuartileData;
		hourly: GipQuartileData;
	};
	/** Confidence index (0-1, for internal DGT use) */
	confidenceIndex: string | null;
	/** Start of the GIP file data-collection window (e.g. "2026-01-01"), shown in the prefill PDF. */
	periodStart?: string | null;
	/** End of the GIP file data-collection window (e.g. "2026-12-31"), shown in the prefill PDF. */
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
			annualMeanGap: row.globalAnnualMeanGap,
			hourlyMeanWomen: row.globalHourlyMeanWomen,
			hourlyMeanMen: row.globalHourlyMeanMen,
			hourlyMeanGap: row.globalHourlyMeanGap,
			annualMedianWomen: row.globalAnnualMedianWomen,
			annualMedianMen: row.globalAnnualMedianMen,
			annualMedianGap: row.globalAnnualMedianGap,
			hourlyMedianWomen: row.globalHourlyMedianWomen,
			hourlyMedianMen: row.globalHourlyMedianMen,
			hourlyMedianGap: row.globalHourlyMedianGap,
		},
		step3: {
			annualMeanWomen: row.variableAnnualMeanWomen,
			annualMeanMen: row.variableAnnualMeanMen,
			annualMeanGap: row.variableAnnualMeanGap,
			hourlyMeanWomen: row.variableHourlyMeanWomen,
			hourlyMeanMen: row.variableHourlyMeanMen,
			hourlyMeanGap: row.variableHourlyMeanGap,
			annualMedianWomen: row.variableAnnualMedianWomen,
			annualMedianMen: row.variableAnnualMedianMen,
			annualMedianGap: row.variableAnnualMedianGap,
			hourlyMedianWomen: row.variableHourlyMedianWomen,
			hourlyMedianMen: row.variableHourlyMedianMen,
			hourlyMedianGap: row.variableHourlyMedianGap,
			beneficiaryCountWomen: toInt(row.womenCountAnnualVariable),
			beneficiaryCountMen: toInt(row.menCountAnnualVariable),
		},
		step4: {
			annual: buildQuartileData(
				[
					row.annualQuartileThreshold1,
					row.annualQuartileThreshold2,
					row.annualQuartileThreshold3,
				],
				[
					row.annualQuartile1WomenCount,
					row.annualQuartile2WomenCount,
					row.annualQuartile3WomenCount,
					row.annualQuartile4WomenCount,
				],
				[
					row.annualQuartile1MenCount,
					row.annualQuartile2MenCount,
					row.annualQuartile3MenCount,
					row.annualQuartile4MenCount,
				],
			),
			hourly: buildQuartileData(
				[
					row.hourlyQuartileThreshold1,
					row.hourlyQuartileThreshold2,
					row.hourlyQuartileThreshold3,
				],
				[
					row.hourlyQuartile1WomenCount,
					row.hourlyQuartile2WomenCount,
					row.hourlyQuartile3WomenCount,
					row.hourlyQuartile4WomenCount,
				],
				[
					row.hourlyQuartile1MenCount,
					row.hourlyQuartile2MenCount,
					row.hourlyQuartile3MenCount,
					row.hourlyQuartile4MenCount,
				],
			),
		},
		confidenceIndex: row.confidenceIndex,
		periodStart: row.periodStart,
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
	Rem_globale_annuelle_mediane_ecart: "globalAnnualMedianGap",
	Rem_globale_annuelle_mediane_F: "globalAnnualMedianWomen",
	Rem_globale_annuelle_mediane_H: "globalAnnualMedianMen",
	Taux_horaire_global_median_ecart: "globalHourlyMedianGap",
	Taux_globale_annuelle_mediane_F: "globalHourlyMedianWomen",
	Taux_globale_annuelle_mediane_H: "globalHourlyMedianMen",
	Rem_variable_annuelle_mediane_ecart: "variableAnnualMedianGap",
	Rem_variable_annuelle_mediane_F: "variableAnnualMedianWomen",
	Rem_variable_annuelle_mediane_H: "variableAnnualMedianMen",
	Taux_horaire_variable_median_ecart: "variableHourlyMedianGap",
	Taux_horaire_variable_median_F: "variableHourlyMedianWomen",
	Taux_horaire_variable_median_H: "variableHourlyMedianMen",
	Proportion_variable_F: "variableProportionWomen",
	Proportion_variable_H: "variableProportionMen",
	Seuil_Q1_Rem_globale: "annualQuartileThreshold1",
	Seuil_Q2_Rem_globale: "annualQuartileThreshold2",
	Seuil_Q3_Rem_globale: "annualQuartileThreshold3",
	Quartile1_Rem_globale_annuelle_proportion_F: "annualQuartile1ProportionWomen",
	Quartile2_Rem_globale_annuelle_proportion_F: "annualQuartile2ProportionWomen",
	Quartile3_Rem_globale_annuelle_proportion_F: "annualQuartile3ProportionWomen",
	Quartile4_Rem_globale_annuelle_proportion_F: "annualQuartile4ProportionWomen",
	Quartile1_Rem_globale_annuelle_proportion_H: "annualQuartile1ProportionMen",
	Quartile2_Rem_globale_annuelle_proportion_H: "annualQuartile2ProportionMen",
	Quartile3_Rem_globale_annuelle_proportion_H: "annualQuartile3ProportionMen",
	Quartile4_Rem_globale_annuelle_proportion_H: "annualQuartile4ProportionMen",
	Quartile1_Rem_globale_annuelle_nb_F: "annualQuartile1WomenCount",
	Quartile2_Rem_globale_annuelle_nb_F: "annualQuartile2WomenCount",
	Quartile3_Rem_globale_annuelle_nb_F: "annualQuartile3WomenCount",
	Quartile4_Rem_globale_annuelle_nb_F: "annualQuartile4WomenCount",
	Quartile1_Rem_globale_annuelle_nb_H: "annualQuartile1MenCount",
	Quartile2_Rem_globale_annuelle_nb_H: "annualQuartile2MenCount",
	Quartile3_Rem_globale_annuelle_nb_H: "annualQuartile3MenCount",
	Quartile4_Rem_globale_annuelle_nb_H: "annualQuartile4MenCount",
	Seuil_Q1_Taux_horaire_global: "hourlyQuartileThreshold1",
	Seuil_Q2_Taux_horaire_global: "hourlyQuartileThreshold2",
	Seuil_Q3_Taux_horaire_global: "hourlyQuartileThreshold3",
	Quartile1_Taux_horaire_global_proportion_F: "hourlyQuartile1ProportionWomen",
	Quartile2_Taux_horaire_global_proportion_F: "hourlyQuartile2ProportionWomen",
	Quartile3_Taux_horaire_global_proportion_F: "hourlyQuartile3ProportionWomen",
	Quartile4_Taux_horaire_global_proportion_F: "hourlyQuartile4ProportionWomen",
	Quartile1_Taux_horaire_global_proportion_H: "hourlyQuartile1ProportionMen",
	Quartile2_Taux_horaire_global_proportion_H: "hourlyQuartile2ProportionMen",
	Quartile3_Taux_horaire_global_proportion_H: "hourlyQuartile3ProportionMen",
	Quartile4_Taux_horaire_global_proportion_H: "hourlyQuartile4ProportionMen",
	Quartile1_Taux_horaire_global_nb_F: "hourlyQuartile1WomenCount",
	Quartile2_Taux_horaire_global_nb_F: "hourlyQuartile2WomenCount",
	Quartile3_Taux_horaire_global_nb_F: "hourlyQuartile3WomenCount",
	Quartile4_Taux_horaire_global_nb_F: "hourlyQuartile4WomenCount",
	Quartile1_Taux_horaire_global_nb_H: "hourlyQuartile1MenCount",
	Quartile2_Taux_horaire_global_nb_H: "hourlyQuartile2MenCount",
	Quartile3_Taux_horaire_global_nb_H: "hourlyQuartile3MenCount",
	Quartile4_Taux_horaire_global_nb_H: "hourlyQuartile4MenCount",
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
 * Build quartile data from the GIP `nb_F`/`nb_H` columns.
 * The per-quartile headcounts are the source of truth — never derived from
 * proportions. A GIP row without `nb` columns yields empty cells (the
 * declarant fills them by hand); there is no proportion fallback.
 */
function buildQuartileData(
	thresholds: [string | null, string | null, string | null],
	womenCounts: [string | null, string | null, string | null, string | null],
	menCounts: [string | null, string | null, string | null, string | null],
): GipQuartileData {
	return {
		thresholds,
		womenCounts: [
			toInt(womenCounts[0]),
			toInt(womenCounts[1]),
			toInt(womenCounts[2]),
			toInt(womenCounts[3]),
		],
		menCounts: [
			toInt(menCounts[0]),
			toInt(menCounts[1]),
			toInt(menCounts[2]),
			toInt(menCounts[3]),
		],
	};
}
