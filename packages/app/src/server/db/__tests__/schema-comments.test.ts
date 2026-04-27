import { describe, expect, it } from "vitest";
import { SCHEMA_COLUMN_COMMENTS } from "../schema-comments";

describe("SCHEMA_COLUMN_COMMENTS", () => {
	describe("format compliance", () => {
		it("every comment uses the SUIT: prefix (no GIP-MDS in T2 entries)", () => {
			for (const [table, columns] of Object.entries(SCHEMA_COLUMN_COMMENTS)) {
				for (const [col, comment] of Object.entries(columns)) {
					expect(comment, `${table}.${col}`).toMatch(/^SUIT: /);
					expect(
						comment,
						`${table}.${col} must not contain GIP-MDS`,
					).not.toContain("GIP-MDS");
				}
			}
		});
	});

	describe("declaration table", () => {
		const decl = SCHEMA_COLUMN_COMMENTS.declaration ?? {};

		it("siren maps to SUIT: SIREN (S1 scenario)", () => {
			expect(decl.siren).toBe("SUIT: SIREN");
		});

		it("year maps to SUIT: Annee", () => {
			expect(decl.year).toBe("SUIT: Annee");
		});

		it("annotates all projected meta columns", () => {
			expect(decl.status).toBe("SUIT: Statut");
			expect(decl.compliance_path).toBe("SUIT: Parcours_conformite");
			expect(decl.total_women).toBe("SUIT: Effectif_F_rem_annuelle_globale");
			expect(decl.total_men).toBe("SUIT: Effectif_H_rem_annuelle_globale");
			expect(decl.created_at).toBe("SUIT: Date_creation");
			expect(decl.updated_at).toBe("SUIT: Date_modification");
			expect(decl.second_declaration_status).toBe(
				"SUIT: Seconde_declaration.Statut",
			);
			expect(decl.second_decl_reference_period_start).toBe(
				"SUIT: Seconde_declaration.Periode_reference_debut",
			);
			expect(decl.second_decl_reference_period_end).toBe(
				"SUIT: Seconde_declaration.Periode_reference_fin",
			);
		});
	});

	describe("company table", () => {
		const co = SCHEMA_COLUMN_COMMENTS.company ?? {};

		it("annotates all SUIT-exposed company fields", () => {
			expect(co.name).toBe("SUIT: Raison_sociale");
			expect(co.workforce).toBe("SUIT: Effectif");
			expect(co.naf_code).toBe("SUIT: Code_NAF");
			expect(co.address).toBe("SUIT: Adresse");
			expect(co.has_cse).toBe("SUIT: CSE_existant");
		});

		it("does not annotate internal-only fields", () => {
			expect(co.siren).toBeUndefined();
			expect(co.created_at).toBeUndefined();
			expect(co.updated_at).toBeUndefined();
		});
	});

	describe("user table", () => {
		const u = SCHEMA_COLUMN_COMMENTS.user ?? {};

		it("annotates declarant fields exposed via SUIT", () => {
			expect(u.first_name).toBe("SUIT: Declarant.Prenom");
			expect(u.last_name).toBe("SUIT: Declarant.Nom");
			expect(u.email).toBe("SUIT: Declarant.Email");
			expect(u.phone).toBe("SUIT: Declarant.Telephone");
		});
	});

	describe("cse_opinion table", () => {
		const cse = SCHEMA_COLUMN_COMMENTS.cse_opinion ?? {};

		it("annotates CSE opinion fields", () => {
			expect(cse.declaration_number).toBe("SUIT: Avis_CSE.Numero_declaration");
			expect(cse.type).toBe("SUIT: Avis_CSE.Type");
			expect(cse.opinion).toBe("SUIT: Avis_CSE.Avis");
			expect(cse.opinion_date).toBe("SUIT: Avis_CSE.Date");
		});
	});

	describe("file table", () => {
		const f = SCHEMA_COLUMN_COMMENTS.file ?? {};

		it("annotates SUIT-exposed file fields", () => {
			expect(f.id).toBe("SUIT: Fichiers_CSE.Id");
			expect(f.file_name).toBe("SUIT: Fichiers_CSE.Nom_fichier");
			expect(f.uploaded_at).toBe("SUIT: Fichiers_CSE.Date_upload");
			expect(f.type).toBe("SUIT: Fichiers_CSE.Type");
		});

		it("does not annotate file_path (internal, not in SUIT JSON)", () => {
			expect(f.file_path).toBeUndefined();
		});
	});

	describe("job_category table (indicator G)", () => {
		const jc = SCHEMA_COLUMN_COMMENTS.job_category ?? {};

		it("annotates category name and detail without GIP-MDS prefix", () => {
			expect(jc.name).toBe("SUIT: Indicateurs.G.Nom_categorie");
			expect(jc.detail).toBe("SUIT: Indicateurs.G.Detail_categorie");
		});
	});

	describe("employee_category table (indicator G)", () => {
		const ec = SCHEMA_COLUMN_COMMENTS.employee_category ?? {};

		it("annotates all SUIT-exposed employee category fields", () => {
			expect(ec.women_count).toBe("SUIT: Indicateurs.G.Effectif_F");
			expect(ec.men_count).toBe("SUIT: Indicateurs.G.Effectif_H");
			expect(ec.annual_base_women).toBe(
				"SUIT: Indicateurs.G.Rem_annuelle_base_F",
			);
			expect(ec.annual_base_men).toBe(
				"SUIT: Indicateurs.G.Rem_annuelle_base_H",
			);
			expect(ec.annual_variable_women).toBe(
				"SUIT: Indicateurs.G.Rem_annuelle_variable_F",
			);
			expect(ec.annual_variable_men).toBe(
				"SUIT: Indicateurs.G.Rem_annuelle_variable_H",
			);
			expect(ec.hourly_base_women).toBe(
				"SUIT: Indicateurs.G.Taux_horaire_base_F",
			);
			expect(ec.hourly_base_men).toBe(
				"SUIT: Indicateurs.G.Taux_horaire_base_H",
			);
			expect(ec.hourly_variable_women).toBe(
				"SUIT: Indicateurs.G.Taux_horaire_variable_F",
			);
			expect(ec.hourly_variable_men).toBe(
				"SUIT: Indicateurs.G.Taux_horaire_variable_H",
			);
		});
	});
});
