/**
 * Column-level documentation attached to the DB schema and rendered on the
 * wiki (https://github.com/SocialGouv/egapro/wiki/Schema-Egapro-V2) by the
 * `db-schema.yaml` workflow via `scripts/post-process-schema-wiki.ts`.
 *
 * Key = lowercase table name as produced by db-schema-toolkit (without the
 * `app_` prefix, matching the "Table: <name>" section headers in the Markdown).
 * Value = map of snake_case column name → human-readable comment.
 * Column names must be snake_case (e.g. `indicator_a_annual_women`) — the
 * post-processing script converts camelCase column names from the Markdown to
 * snake_case before lookup.
 *
 * Populated in tickets T1 (indicators A–F, GIP-MDS origin) and T2 (other
 * SUIT-exposed columns: company identity, declarant, CSE, files, indicator G).
 */
export type SchemaColumnComments = Record<string, Record<string, string>>;

export const SCHEMA_COLUMN_COMMENTS: SchemaColumnComments = {
	declaration: {
		// Indicator A — mean global remuneration (GIP-MDS)
		indicator_a_annual_women: "GIP-MDS | SUIT: Rem_globale_annuelle_moyenne_F",
		indicator_a_annual_men: "GIP-MDS | SUIT: Rem_globale_annuelle_moyenne_H",
		indicator_a_hourly_women: "GIP-MDS | SUIT: Taux_horaire_global_moyen_F",
		indicator_a_hourly_men: "GIP-MDS | SUIT: Taux_horaire_global_moyen_H",
		// Indicator B — mean variable remuneration (GIP-MDS)
		indicator_b_annual_women: "GIP-MDS | SUIT: Rem_variable_annuelle_moyenne_F",
		indicator_b_annual_men: "GIP-MDS | SUIT: Rem_variable_annuelle_moyenne_H",
		indicator_b_hourly_women: "GIP-MDS | SUIT: Taux_horaire_variable_moyen_F",
		indicator_b_hourly_men: "GIP-MDS | SUIT: Taux_horaire_variable_moyen_H",
		// Indicator C — median global remuneration (GIP-MDS)
		indicator_c_annual_women: "GIP-MDS | SUIT: Rem_globale_annuelle_médiane_F",
		indicator_c_annual_men: "GIP-MDS | SUIT: Rem_globale_annuelle_médiane_H",
		indicator_c_hourly_women: "GIP-MDS | SUIT: Taux_globale_annuelle_médiane_F",
		indicator_c_hourly_men: "GIP-MDS | SUIT: Taux_globale_annuelle_médiane_H",
		// Indicator D — median variable remuneration (GIP-MDS)
		indicator_d_annual_women: "GIP-MDS | SUIT: Rem_variable_annuelle_médiane_F",
		indicator_d_annual_men: "GIP-MDS | SUIT: Rem_variable_annuelle_médiane_H",
		indicator_d_hourly_women: "GIP-MDS | SUIT: Taux_horaire_variable_médian_F",
		indicator_d_hourly_men: "GIP-MDS | SUIT: Taux_horaire_variable_médian_H",
		// Indicator E — variable pay beneficiary counts (GIP-MDS)
		indicator_e_women: "GIP-MDS | SUIT: Effectif_F_rem_annuelle_variable",
		indicator_e_men: "GIP-MDS | SUIT: Effectif_H_rem_annuelle_variable",
		// Indicator F — annual quartile thresholds (GIP-MDS)
		indicator_f_annual_threshold1: "GIP-MDS | SUIT: Seuil_Q1_Rem_globale",
		indicator_f_annual_threshold2: "GIP-MDS | SUIT: Seuil_Q2_Rem_globale",
		indicator_f_annual_threshold3: "GIP-MDS | SUIT: Seuil_Q3_Rem_globale",
		indicator_f_annual_threshold4: "GIP-MDS | SUIT: Seuil_Q4_Rem_globale",
		// Indicator F — annual quartile women counts → proportion F (GIP-MDS)
		indicator_f_annual_women1:
			"GIP-MDS | SUIT: Quartile1_Rem_globale_annuelle_proportion_F",
		indicator_f_annual_women2:
			"GIP-MDS | SUIT: Quartile2_Rem_globale_annuelle_proportion_F",
		indicator_f_annual_women3:
			"GIP-MDS | SUIT: Quartile3_Rem_globale_annuelle_proportion_F",
		indicator_f_annual_women4:
			"GIP-MDS | SUIT: Quartile4_Rem_globale_annuelle_proportion_F",
		// Indicator F — annual quartile men counts → proportion H (GIP-MDS)
		indicator_f_annual_men1:
			"GIP-MDS | SUIT: Quartile1_Rem_globale_annuelle_proportion_H",
		indicator_f_annual_men2:
			"GIP-MDS | SUIT: Quartile2_Rem_globale_annuelle_proportion_H",
		indicator_f_annual_men3:
			"GIP-MDS | SUIT: Quartile3_Rem_globale_annuelle_proportion_H",
		indicator_f_annual_men4:
			"GIP-MDS | SUIT: Quartile4_Rem_globale_annuelle_proportion_H",
		// Indicator F — hourly quartile thresholds (GIP-MDS)
		indicator_f_hourly_threshold1:
			"GIP-MDS | SUIT: Seuil_Q1_Taux_horaire_global",
		indicator_f_hourly_threshold2:
			"GIP-MDS | SUIT: Seuil_Q2_Taux_horaire_global",
		indicator_f_hourly_threshold3:
			"GIP-MDS | SUIT: Seuil_Q3_Taux_horaire_global",
		indicator_f_hourly_threshold4:
			"GIP-MDS | SUIT: Seuil_Q4_Taux_horaire_global",
		// Indicator F — hourly quartile women counts → proportion F (GIP-MDS)
		indicator_f_hourly_women1:
			"GIP-MDS | SUIT: Quartile1_Taux_horaire_global_proportion_F",
		indicator_f_hourly_women2:
			"GIP-MDS | SUIT: Quartile2_Taux_horaire_global_proportion_F",
		indicator_f_hourly_women3:
			"GIP-MDS | SUIT: Quartile3_Taux_horaire_global_proportion_F",
		indicator_f_hourly_women4:
			"GIP-MDS | SUIT: Quartile4_Taux_horaire_global_proportion_F",
		// Indicator F — hourly quartile men counts → proportion H (GIP-MDS)
		indicator_f_hourly_men1:
			"GIP-MDS | SUIT: Quartile1_Taux_horaire_global_proportion_H",
		indicator_f_hourly_men2:
			"GIP-MDS | SUIT: Quartile2_Taux_horaire_global_proportion_H",
		indicator_f_hourly_men3:
			"GIP-MDS | SUIT: Quartile3_Taux_horaire_global_proportion_H",
		indicator_f_hourly_men4:
			"GIP-MDS | SUIT: Quartile4_Taux_horaire_global_proportion_H",
	},
};
