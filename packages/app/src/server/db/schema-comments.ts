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
	// T1 entries (indicators A–F, GIP-MDS origin) are added by ticket T1.
	// T2 entries below cover all other SUIT-exposed columns.
	declaration: {
		// Declaration identity & meta
		siren: "SUIT: SIREN",
		year: "SUIT: Annee",
		status: "SUIT: Statut",
		compliance_path: "SUIT: Parcours_conformite",
		created_at: "SUIT: Date_creation",
		updated_at: "SUIT: Date_modification",
		// Workforce headcounts (company-declared, not GIP-MDS)
		total_women: "SUIT: Effectif_F_rem_annuelle_globale",
		total_men: "SUIT: Effectif_H_rem_annuelle_globale",
		// Second declaration fields
		second_declaration_status: "SUIT: Seconde_declaration.Statut",
		second_decl_reference_period_start:
			"SUIT: Seconde_declaration.Periode_reference_debut",
		second_decl_reference_period_end:
			"SUIT: Seconde_declaration.Periode_reference_fin",
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
		id: "SUIT: Fichiers_CSE.Id / Fichier_evaluation_conjointe.Id",
		file_name:
			"SUIT: Fichiers_CSE.Nom_fichier / Fichier_evaluation_conjointe.Nom_fichier",
		uploaded_at:
			"SUIT: Fichiers_CSE.Date_upload / Fichier_evaluation_conjointe.Date_upload",
	},
	// Indicator G — company-calculated CSP pay gaps (no GIP-MDS origin)
	job_category: {
		name: "SUIT: Indicateurs.G.Nom_categorie",
		detail: "SUIT: Indicateurs.G.Detail_categorie",
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
