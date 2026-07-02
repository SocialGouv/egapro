/**
 * French labels used by the SUIT JSON export (`/api/v1/export/declarations`).
 *
 * For indicators A–F the keys match the GIP MDS CSV header names (single
 * source of truth), so consumers can cross-reference the export with the
 * raw GIP files they already ingest. For other fields the keys follow the
 * same underscore-separated French style to stay consistent.
 */

import { proportionOf } from "~/modules/domain";

/** Indicator A — mean global remuneration. */
export const INDICATOR_A_LABELS = {
	annualWomen: "Rem_globale_annuelle_moyenne_F",
	annualMen: "Rem_globale_annuelle_moyenne_H",
	hourlyWomen: "Taux_horaire_global_moyen_F",
	hourlyMen: "Taux_horaire_global_moyen_H",
} as const;

/** Indicator B — mean variable remuneration. */
export const INDICATOR_B_LABELS = {
	annualWomen: "Rem_variable_annuelle_moyenne_F",
	annualMen: "Rem_variable_annuelle_moyenne_H",
	hourlyWomen: "Taux_horaire_variable_moyen_F",
	hourlyMen: "Taux_horaire_variable_moyen_H",
} as const;

/** Indicator C — median global remuneration. */
export const INDICATOR_C_LABELS = {
	annualWomen: "Rem_globale_annuelle_médiane_F",
	annualMen: "Rem_globale_annuelle_médiane_H",
	hourlyWomen: "Taux_globale_annuelle_médiane_F",
	hourlyMen: "Taux_globale_annuelle_médiane_H",
} as const;

/** Indicator D — median variable remuneration. */
export const INDICATOR_D_LABELS = {
	annualWomen: "Rem_variable_annuelle_médiane_F",
	annualMen: "Rem_variable_annuelle_médiane_H",
	hourlyWomen: "Taux_horaire_variable_médian_F",
	hourlyMen: "Taux_horaire_variable_médian_H",
} as const;

/** Indicator A gap label — signed ratio (m - w) / m, range -1..1, mirrors GIP CSV. */
export const INDICATOR_A_GAP_LABELS = {
	annual: "Rem_globale_annuelle_moyenne_ecart",
	hourly: "Taux_horaire_global_moyen_ecart",
} as const;

/** Indicator B gap label — signed ratio (m - w) / m, range -1..1, mirrors GIP CSV. */
export const INDICATOR_B_GAP_LABELS = {
	annual: "Rem_variable_annuelle_moyenne_ecart",
	hourly: "Taux_horaire_variable_moyen_ecart",
} as const;

/** Indicator C gap label — signed ratio (m - w) / m, range -1..1, mirrors GIP CSV. */
export const INDICATOR_C_GAP_LABELS = {
	annual: "Rem_globale_annuelle_médiane_ecart",
	hourly: "Taux_horaire_global_médian_ecart",
} as const;

/** Indicator D gap label — signed ratio (m - w) / m, range -1..1, mirrors GIP CSV. */
export const INDICATOR_D_GAP_LABELS = {
	annual: "Rem_variable_annuelle_médiane_ecart",
	hourly: "Taux_horaire_variable_médian_ecart",
} as const;

/** Indicator E proportion labels — ratio 0..1, mirrors GIP CSV. */
export const INDICATOR_E_PROPORTION_LABELS = {
	women: "Proportion_variable_F",
	men: "Proportion_variable_H",
} as const;

/** Indicator E — variable pay beneficiary counts. */
export const INDICATOR_E_LABELS = {
	women: "Effectif_F_rem_annuelle_variable",
	men: "Effectif_H_rem_annuelle_variable",
} as const;

/** Indicator F — quartile labels, per period and per quartile index (1..4). */
export const INDICATOR_F_ANNUAL_THRESHOLD_LABELS = [
	"Seuil_Q1_Rem_globale",
	"Seuil_Q2_Rem_globale",
	"Seuil_Q3_Rem_globale",
] as const;

export const INDICATOR_F_HOURLY_THRESHOLD_LABELS = [
	"Seuil_Q1_Taux_horaire_global",
	"Seuil_Q2_Taux_horaire_global",
	"Seuil_Q3_Taux_horaire_global",
] as const;

export const INDICATOR_F_ANNUAL_WOMEN_LABELS = [
	"Quartile1_Rem_globale_annuelle_proportion_F",
	"Quartile2_Rem_globale_annuelle_proportion_F",
	"Quartile3_Rem_globale_annuelle_proportion_F",
	"Quartile4_Rem_globale_annuelle_proportion_F",
] as const;

export const INDICATOR_F_ANNUAL_MEN_LABELS = [
	"Quartile1_Rem_globale_annuelle_proportion_H",
	"Quartile2_Rem_globale_annuelle_proportion_H",
	"Quartile3_Rem_globale_annuelle_proportion_H",
	"Quartile4_Rem_globale_annuelle_proportion_H",
] as const;

export const INDICATOR_F_HOURLY_WOMEN_LABELS = [
	"Quartile1_Taux_horaire_global_proportion_F",
	"Quartile2_Taux_horaire_global_proportion_F",
	"Quartile3_Taux_horaire_global_proportion_F",
	"Quartile4_Taux_horaire_global_proportion_F",
] as const;

export const INDICATOR_F_HOURLY_MEN_LABELS = [
	"Quartile1_Taux_horaire_global_proportion_H",
	"Quartile2_Taux_horaire_global_proportion_H",
	"Quartile3_Taux_horaire_global_proportion_H",
	"Quartile4_Taux_horaire_global_proportion_H",
] as const;

/**
 * Compute the women/men proportion inside one indicator F quartile from the
 * declared headcounts. Returns `null` when data is missing or the quartile
 * has no one in it. Rounded to 4 decimals for parity with the GIP CSV format.
 */
export function quartileProportion(
	count: number | null,
	totalCount: number | null,
): number | null {
	if (count === null || totalCount === null || totalCount === 0) return null;
	return Math.round(proportionOf(count, totalCount) * 10_000) / 10_000;
}
