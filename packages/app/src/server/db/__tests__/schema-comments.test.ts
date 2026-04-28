import { describe, expect, it } from "vitest";
import { SCHEMA_COLUMN_COMMENTS } from "../schema-comments";

describe("SCHEMA_COLUMN_COMMENTS — T2 non-GIP entries", () => {
	describe("declaration table", () => {
		it("annotates siren", () => {
			expect(SCHEMA_COLUMN_COMMENTS.declaration?.siren).toBe("SUIT: SIREN");
		});
		it("annotates year", () => {
			expect(SCHEMA_COLUMN_COMMENTS.declaration?.year).toBe("SUIT: Annee");
		});
		it("annotates status", () => {
			expect(SCHEMA_COLUMN_COMMENTS.declaration?.status).toBe("SUIT: Statut");
		});
		it("annotates compliance_path", () => {
			expect(SCHEMA_COLUMN_COMMENTS.declaration?.compliance_path).toBe(
				"SUIT: Parcours_conformite",
			);
		});
		it("annotates total_women", () => {
			expect(SCHEMA_COLUMN_COMMENTS.declaration?.total_women).toBe(
				"SUIT: Effectif_F_rem_annuelle_globale",
			);
		});
		it("annotates total_men", () => {
			expect(SCHEMA_COLUMN_COMMENTS.declaration?.total_men).toBe(
				"SUIT: Effectif_H_rem_annuelle_globale",
			);
		});
		it("annotates created_at", () => {
			expect(SCHEMA_COLUMN_COMMENTS.declaration?.created_at).toBe(
				"SUIT: Date_creation",
			);
		});
		it("annotates updated_at", () => {
			expect(SCHEMA_COLUMN_COMMENTS.declaration?.updated_at).toBe(
				"SUIT: Date_modification",
			);
		});
		it("annotates second_declaration_status", () => {
			expect(
				SCHEMA_COLUMN_COMMENTS.declaration?.second_declaration_status,
			).toBe("SUIT: Seconde_declaration.Statut");
		});
		it("annotates second_decl_reference_period_start", () => {
			expect(
				SCHEMA_COLUMN_COMMENTS.declaration?.second_decl_reference_period_start,
			).toBe("SUIT: Seconde_declaration.Periode_reference_debut");
		});
		it("annotates second_decl_reference_period_end", () => {
			expect(
				SCHEMA_COLUMN_COMMENTS.declaration?.second_decl_reference_period_end,
			).toBe("SUIT: Seconde_declaration.Periode_reference_fin");
		});
	});

	describe("company table", () => {
		it("annotates name", () => {
			expect(SCHEMA_COLUMN_COMMENTS.company?.name).toBe("SUIT: Raison_sociale");
		});
		it("annotates workforce", () => {
			expect(SCHEMA_COLUMN_COMMENTS.company?.workforce).toBe("SUIT: Effectif");
		});
		it("annotates naf_code", () => {
			expect(SCHEMA_COLUMN_COMMENTS.company?.naf_code).toBe("SUIT: Code_NAF");
		});
		it("annotates address", () => {
			expect(SCHEMA_COLUMN_COMMENTS.company?.address).toBe("SUIT: Adresse");
		});
		it("annotates has_cse", () => {
			expect(SCHEMA_COLUMN_COMMENTS.company?.has_cse).toBe(
				"SUIT: CSE_existant",
			);
		});
	});

	describe("user table", () => {
		it("annotates first_name", () => {
			expect(SCHEMA_COLUMN_COMMENTS.user?.first_name).toBe(
				"SUIT: Declarant.Prenom",
			);
		});
		it("annotates last_name", () => {
			expect(SCHEMA_COLUMN_COMMENTS.user?.last_name).toBe(
				"SUIT: Declarant.Nom",
			);
		});
		it("annotates email", () => {
			expect(SCHEMA_COLUMN_COMMENTS.user?.email).toBe("SUIT: Declarant.Email");
		});
		it("annotates phone", () => {
			expect(SCHEMA_COLUMN_COMMENTS.user?.phone).toBe(
				"SUIT: Declarant.Telephone",
			);
		});
	});

	describe("cse_opinion table", () => {
		it("annotates declaration_number", () => {
			expect(SCHEMA_COLUMN_COMMENTS.cse_opinion?.declaration_number).toBe(
				"SUIT: Avis_CSE.Numero_declaration",
			);
		});
		it("annotates type", () => {
			expect(SCHEMA_COLUMN_COMMENTS.cse_opinion?.type).toBe(
				"SUIT: Avis_CSE.Type",
			);
		});
		it("annotates opinion", () => {
			expect(SCHEMA_COLUMN_COMMENTS.cse_opinion?.opinion).toBe(
				"SUIT: Avis_CSE.Avis",
			);
		});
		it("annotates opinion_date", () => {
			expect(SCHEMA_COLUMN_COMMENTS.cse_opinion?.opinion_date).toBe(
				"SUIT: Avis_CSE.Date",
			);
		});
	});

	describe("file table", () => {
		it("annotates id", () => {
			expect(SCHEMA_COLUMN_COMMENTS.file?.id).toBe("SUIT: Fichiers.Id");
		});
		it("annotates file_name", () => {
			expect(SCHEMA_COLUMN_COMMENTS.file?.file_name).toBe(
				"SUIT: Fichiers.Nom_fichier",
			);
		});
		it("annotates uploaded_at", () => {
			expect(SCHEMA_COLUMN_COMMENTS.file?.uploaded_at).toBe(
				"SUIT: Fichiers.Date_upload",
			);
		});
	});

	describe("job_category table (indicator G)", () => {
		it("annotates name", () => {
			expect(SCHEMA_COLUMN_COMMENTS.job_category?.name).toBe(
				"SUIT: Indicateurs.G.Nom_categorie",
			);
		});
		it("annotates detail", () => {
			expect(SCHEMA_COLUMN_COMMENTS.job_category?.detail).toBe(
				"SUIT: Indicateurs.G.Detail_categorie",
			);
		});
	});

	describe("employee_category table (indicator G)", () => {
		it("annotates women_count", () => {
			expect(SCHEMA_COLUMN_COMMENTS.employee_category?.women_count).toBe(
				"SUIT: Indicateurs.G.Effectif_F",
			);
		});
		it("annotates men_count", () => {
			expect(SCHEMA_COLUMN_COMMENTS.employee_category?.men_count).toBe(
				"SUIT: Indicateurs.G.Effectif_H",
			);
		});
		it("annotates annual_base_women", () => {
			expect(SCHEMA_COLUMN_COMMENTS.employee_category?.annual_base_women).toBe(
				"SUIT: Indicateurs.G.Rem_annuelle_base_F",
			);
		});
		it("annotates annual_base_men", () => {
			expect(SCHEMA_COLUMN_COMMENTS.employee_category?.annual_base_men).toBe(
				"SUIT: Indicateurs.G.Rem_annuelle_base_H",
			);
		});
		it("annotates annual_variable_women", () => {
			expect(
				SCHEMA_COLUMN_COMMENTS.employee_category?.annual_variable_women,
			).toBe("SUIT: Indicateurs.G.Rem_annuelle_variable_F");
		});
		it("annotates annual_variable_men", () => {
			expect(
				SCHEMA_COLUMN_COMMENTS.employee_category?.annual_variable_men,
			).toBe("SUIT: Indicateurs.G.Rem_annuelle_variable_H");
		});
		it("annotates hourly_base_women", () => {
			expect(SCHEMA_COLUMN_COMMENTS.employee_category?.hourly_base_women).toBe(
				"SUIT: Indicateurs.G.Taux_horaire_base_F",
			);
		});
		it("annotates hourly_base_men", () => {
			expect(SCHEMA_COLUMN_COMMENTS.employee_category?.hourly_base_men).toBe(
				"SUIT: Indicateurs.G.Taux_horaire_base_H",
			);
		});
		it("annotates hourly_variable_women", () => {
			expect(
				SCHEMA_COLUMN_COMMENTS.employee_category?.hourly_variable_women,
			).toBe("SUIT: Indicateurs.G.Taux_horaire_variable_F");
		});
		it("annotates hourly_variable_men", () => {
			expect(
				SCHEMA_COLUMN_COMMENTS.employee_category?.hourly_variable_men,
			).toBe("SUIT: Indicateurs.G.Taux_horaire_variable_H");
		});
	});

	describe("format invariants", () => {
		it("all T2 table entries start with SUIT: (no GIP-MDS prefix)", () => {
			const t2Tables = [
				"company",
				"user",
				"cse_opinion",
				"file",
				"job_category",
				"employee_category",
			];
			for (const table of t2Tables) {
				for (const [col, comment] of Object.entries(
					SCHEMA_COLUMN_COMMENTS[table] ?? {},
				)) {
					expect(comment, `${table}.${col} should start with "SUIT: "`).toMatch(
						/^SUIT: /,
					);
				}
			}
		});

		it("declaration T2 entries start with SUIT: (no GIP-MDS prefix)", () => {
			const t2DeclarationKeys = [
				"siren",
				"year",
				"status",
				"compliance_path",
				"total_women",
				"total_men",
				"created_at",
				"updated_at",
				"second_declaration_status",
				"second_decl_reference_period_start",
				"second_decl_reference_period_end",
			];
			for (const key of t2DeclarationKeys) {
				const comment = SCHEMA_COLUMN_COMMENTS.declaration?.[key];
				expect(comment, `declaration.${key}`).toMatch(/^SUIT: /);
			}
		});
	});
});
