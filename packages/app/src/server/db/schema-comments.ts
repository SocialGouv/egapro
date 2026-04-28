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
	// Filled by tickets T1 (declaration indicators A–F) and T2 (everything else).

	declaration: {
		// Meta
		siren: "SUIT: SIREN",
		year: "SUIT: Annee",
		status: "SUIT: Statut",
		compliance_path: "SUIT: Parcours_conformite",
		total_women: "SUIT: Effectif_F_rem_annuelle_globale",
		total_men: "SUIT: Effectif_H_rem_annuelle_globale",
		created_at: "SUIT: Date_creation",
		updated_at: "SUIT: Date_modification",
		// Second declaration
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
		id: "SUIT: Fichiers.Id",
		file_name: "SUIT: Fichiers.Nom_fichier",
		uploaded_at: "SUIT: Fichiers.Date_upload",
	},

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
