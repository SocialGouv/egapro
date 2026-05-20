/**
 * Column-level documentation attached to the DB schema and rendered on the
 * wiki (https://github.com/SocialGouv/egapro/wiki/Schema-Egapro-V2) by the
 * `db-schema.yaml` workflow via `scripts/post-process-schema-wiki.ts`.
 *
 * Key = Drizzle snake_case table name (without the `app_` prefix).
 * Value = map of snake_case column name → human-readable comment.
 *
 * Populated in tickets T1 (indicators A–F, GIP-MDS origin) and T2 (other
 * SUIT-exposed columns: company identity, declarant, CSE, files, indicator G).
 */
export type SchemaColumnComments = Record<string, Record<string, string>>;

export const SCHEMA_COLUMN_COMMENTS: SchemaColumnComments = {
	declaration: {
		cancelled_at:
			"Timestamp d'annulation administrative (soft-cancel). null = déclaration active. La déclaration est conservée intacte pour audit et transmission API SUIT.",
		// ── Identity & meta (T2 — SUIT, not GIP-MDS) ──
		siren: "SUIT: SIREN",
		year: "SUIT: Annee",
		status: "SUIT: Statut",
		first_declaration_path_choice: "SUIT: Parcours_apres_declaration_1",
		second_declaration_path_choice: "SUIT: Parcours_apres_declaration_2",
		cse_required: "SUIT: Avis_CSE_requis",
		rules_version: "SUIT: Version_regles",
		total_women: "SUIT: Effectif_F_rem_annuelle_globale",
		total_men: "SUIT: Effectif_H_rem_annuelle_globale",
		created_at: "SUIT: Date_creation",
		updated_at: "SUIT: Date_modification",
		// ── Second declaration ──
		second_decl_reference_period_start:
			"SUIT: Seconde_declaration.Periode_reference_debut",
		second_decl_reference_period_end:
			"SUIT: Seconde_declaration.Periode_reference_fin",
		// ── Indicators A–F (T1 — GIP-MDS → SUIT) ──
		// Indicator A — mean global remuneration (GIP-MDS → SUIT)
		indicator_a_annual_women: "GIP-MDS | SUIT: Rem_globale_annuelle_moyenne_F",
		indicator_a_annual_men: "GIP-MDS | SUIT: Rem_globale_annuelle_moyenne_H",
		indicator_a_hourly_women: "GIP-MDS | SUIT: Taux_horaire_global_moyen_F",
		indicator_a_hourly_men: "GIP-MDS | SUIT: Taux_horaire_global_moyen_H",
		// Indicator B — mean variable remuneration (GIP-MDS → SUIT)
		indicator_b_annual_women: "GIP-MDS | SUIT: Rem_variable_annuelle_moyenne_F",
		indicator_b_annual_men: "GIP-MDS | SUIT: Rem_variable_annuelle_moyenne_H",
		indicator_b_hourly_women: "GIP-MDS | SUIT: Taux_horaire_variable_moyen_F",
		indicator_b_hourly_men: "GIP-MDS | SUIT: Taux_horaire_variable_moyen_H",
		// Indicator C — median global remuneration (GIP-MDS → SUIT)
		indicator_c_annual_women: "GIP-MDS | SUIT: Rem_globale_annuelle_médiane_F",
		indicator_c_annual_men: "GIP-MDS | SUIT: Rem_globale_annuelle_médiane_H",
		indicator_c_hourly_women: "GIP-MDS | SUIT: Taux_globale_annuelle_médiane_F",
		indicator_c_hourly_men: "GIP-MDS | SUIT: Taux_globale_annuelle_médiane_H",
		// Indicator D — median variable remuneration (GIP-MDS → SUIT)
		indicator_d_annual_women: "GIP-MDS | SUIT: Rem_variable_annuelle_médiane_F",
		indicator_d_annual_men: "GIP-MDS | SUIT: Rem_variable_annuelle_médiane_H",
		indicator_d_hourly_women: "GIP-MDS | SUIT: Taux_horaire_variable_médian_F",
		indicator_d_hourly_men: "GIP-MDS | SUIT: Taux_horaire_variable_médian_H",
		// Indicator E — variable pay beneficiary counts (GIP-MDS → SUIT)
		indicator_e_women: "GIP-MDS | SUIT: Effectif_F_rem_annuelle_variable",
		indicator_e_men: "GIP-MDS | SUIT: Effectif_H_rem_annuelle_variable",
		// Indicator F — quartile thresholds, annual (GIP-MDS → SUIT)
		indicator_f_annual_threshold1: "GIP-MDS | SUIT: Seuil_Q1_Rem_globale",
		indicator_f_annual_threshold2: "GIP-MDS | SUIT: Seuil_Q2_Rem_globale",
		indicator_f_annual_threshold3: "GIP-MDS | SUIT: Seuil_Q3_Rem_globale",
		indicator_f_annual_threshold4: "GIP-MDS | SUIT: Seuil_Q4_Rem_globale",
		// Indicator F — quartile women proportions, annual (GIP-MDS → SUIT)
		indicator_f_annual_women1:
			"GIP-MDS | SUIT: Quartile1_Rem_globale_annuelle_proportion_F",
		indicator_f_annual_women2:
			"GIP-MDS | SUIT: Quartile2_Rem_globale_annuelle_proportion_F",
		indicator_f_annual_women3:
			"GIP-MDS | SUIT: Quartile3_Rem_globale_annuelle_proportion_F",
		indicator_f_annual_women4:
			"GIP-MDS | SUIT: Quartile4_Rem_globale_annuelle_proportion_F",
		// Indicator F — quartile men proportions, annual (GIP-MDS → SUIT)
		indicator_f_annual_men1:
			"GIP-MDS | SUIT: Quartile1_Rem_globale_annuelle_proportion_H",
		indicator_f_annual_men2:
			"GIP-MDS | SUIT: Quartile2_Rem_globale_annuelle_proportion_H",
		indicator_f_annual_men3:
			"GIP-MDS | SUIT: Quartile3_Rem_globale_annuelle_proportion_H",
		indicator_f_annual_men4:
			"GIP-MDS | SUIT: Quartile4_Rem_globale_annuelle_proportion_H",
		// Indicator F — quartile thresholds, hourly (GIP-MDS → SUIT)
		indicator_f_hourly_threshold1:
			"GIP-MDS | SUIT: Seuil_Q1_Taux_horaire_global",
		indicator_f_hourly_threshold2:
			"GIP-MDS | SUIT: Seuil_Q2_Taux_horaire_global",
		indicator_f_hourly_threshold3:
			"GIP-MDS | SUIT: Seuil_Q3_Taux_horaire_global",
		indicator_f_hourly_threshold4:
			"GIP-MDS | SUIT: Seuil_Q4_Taux_horaire_global",
		// Indicator F — quartile women proportions, hourly (GIP-MDS → SUIT)
		indicator_f_hourly_women1:
			"GIP-MDS | SUIT: Quartile1_Taux_horaire_global_proportion_F",
		indicator_f_hourly_women2:
			"GIP-MDS | SUIT: Quartile2_Taux_horaire_global_proportion_F",
		indicator_f_hourly_women3:
			"GIP-MDS | SUIT: Quartile3_Taux_horaire_global_proportion_F",
		indicator_f_hourly_women4:
			"GIP-MDS | SUIT: Quartile4_Taux_horaire_global_proportion_F",
		// Indicator F — quartile men proportions, hourly (GIP-MDS → SUIT)
		indicator_f_hourly_men1:
			"GIP-MDS | SUIT: Quartile1_Taux_horaire_global_proportion_H",
		indicator_f_hourly_men2:
			"GIP-MDS | SUIT: Quartile2_Taux_horaire_global_proportion_H",
		indicator_f_hourly_men3:
			"GIP-MDS | SUIT: Quartile3_Taux_horaire_global_proportion_H",
		indicator_f_hourly_men4:
			"GIP-MDS | SUIT: Quartile4_Taux_horaire_global_proportion_H",
		global_annual_mean_gap:
			"GIP-MDS | SUIT: Rem_globale_annuelle_moyenne_ecart",
		global_hourly_mean_gap: "GIP-MDS | SUIT: Taux_horaire_global_moyen_ecart",
		variable_annual_mean_gap:
			"GIP-MDS | SUIT: Rem_variable_annuelle_moyenne_ecart",
		variable_hourly_mean_gap:
			"GIP-MDS | SUIT: Taux_horaire_variable_moyen_ecart",
		global_annual_median_gap:
			"GIP-MDS | SUIT: Rem_globale_annuelle_médiane_ecart",
		global_hourly_median_gap:
			"GIP-MDS | SUIT: Taux_horaire_global_médian_ecart",
		variable_annual_median_gap:
			"GIP-MDS | SUIT: Rem_variable_annuelle_médiane_ecart",
		variable_hourly_median_gap:
			"GIP-MDS | SUIT: Taux_horaire_variable_médian_ecart",
		variable_proportion_women: "GIP-MDS | SUIT: Proportion_variable_F",
		variable_proportion_men: "GIP-MDS | SUIT: Proportion_variable_H",
	},
	company: {
		name: "SUIT: Raison_sociale",
		workforce: "SUIT: Effectif",
		naf_code: "SUIT: Code_NAF",
		address: "SUIT: Adresse",
		has_cse: "SUIT: CSE_existant",
	},
	user: {
		first_name: "SUIT: Declarant.Prenom",
		last_name: "SUIT: Declarant.Nom",
		email: "SUIT: Declarant.Email",
		phone: "SUIT: Declarant.Telephone",
	},
	cse_opinion: {
		declaration_number: "SUIT: Avis_CSE.Numero_declaration",
		type: "SUIT: Avis_CSE.Type",
		opinion: "SUIT: Avis_CSE.Avis",
		opinion_date: "SUIT: Avis_CSE.Date",
	},
	file: {
		id: "SUIT: Fichiers_CSE.Id",
		file_name: "SUIT: Fichiers_CSE.Nom_fichier",
		uploaded_at: "SUIT: Fichiers_CSE.Date_upload",
	},
	job_category: {
		name: "SUIT: Indicateurs.G.Nom_categorie",
	},
	declaration_status_history: {
		declaration_id:
			"Référence vers la déclaration concernée. Append-only — chaque event capture une transition métier (submit / path_choice / *_submit / cse_opinion_submit / cancel / demarche_complete).",
		event_type:
			"Type d'event métier. Source de vérité de la trajectoire FSM (la colonne app_declaration.status est une projection dérivée du dernier event). Inclut step_change pour les transitions du stepper Indicateurs A–F (alimente le KPI K4).",
		value:
			"Charge utile facultative selon le type d'event. Pour path_choice: 'justify' | 'corrective_action' | 'joint_evaluation'. Pour step_change: 'from:N|to:M' (N peut être 'null' à la création).",
		round:
			"1 = première déclaration, 2 = seconde déclaration. Renseigné pour path_choice, second_declaration_submit, joint_evaluation_submit. Pour step_change : numéro de l'étape atteinte (toStep) — facilite l'agrégation côté SQL.",
		actor_user_id:
			"Auteur de l'event. NULL = event système (cron, demarche_complete, etc.).",
		created_at:
			"Timestamp d'émission de l'event (rétention permanente, hors purge CNIL applicable à audit.action_log).",
	},
	employee_category: {
		women_count: "SUIT: Indicateurs.G.Effectif_F",
		men_count: "SUIT: Indicateurs.G.Effectif_H",
		annual_base_women: "SUIT: Indicateurs.G.Rem_annuelle_base_F",
		annual_base_men: "SUIT: Indicateurs.G.Rem_annuelle_base_H",
		annual_variable_women: "SUIT: Indicateurs.G.Rem_annuelle_variable_F",
		annual_variable_men: "SUIT: Indicateurs.G.Rem_annuelle_variable_H",
		hourly_base_women: "SUIT: Indicateurs.G.Taux_horaire_base_F",
		hourly_base_men: "SUIT: Indicateurs.G.Taux_horaire_base_H",
		hourly_variable_women: "SUIT: Indicateurs.G.Taux_horaire_variable_F",
		hourly_variable_men: "SUIT: Indicateurs.G.Taux_horaire_variable_H",
	},
};
