import { describe, expect, it } from "vitest";
import { SCHEMA_COLUMN_COMMENTS } from "../schema-comments";

describe("SCHEMA_COLUMN_COMMENTS", () => {
	it("annotates declaration.siren as SUIT: SIREN (S1)", () => {
		expect(SCHEMA_COLUMN_COMMENTS.declaration?.siren).toBe("SUIT: SIREN");
	});

	it("annotates all declaration meta columns exposed by SUIT", () => {
		const decl = SCHEMA_COLUMN_COMMENTS.declaration;
		expect(decl?.year).toBe("SUIT: Annee");
		expect(decl?.status).toBe("SUIT: Statut");
		expect(decl?.compliance_path).toBe("SUIT: Parcours_conformite");
		expect(decl?.total_women).toBe("SUIT: Effectif_F_rem_annuelle_globale");
		expect(decl?.total_men).toBe("SUIT: Effectif_H_rem_annuelle_globale");
		expect(decl?.created_at).toBe("SUIT: Date_creation");
		expect(decl?.updated_at).toBe("SUIT: Date_modification");
	});

	it("annotates second declaration columns", () => {
		const decl = SCHEMA_COLUMN_COMMENTS.declaration;
		expect(decl?.second_declaration_status).toBe(
			"SUIT: Seconde_declaration.Statut",
		);
		expect(decl?.second_decl_reference_period_start).toBe(
			"SUIT: Seconde_declaration.Periode_reference_debut",
		);
		expect(decl?.second_decl_reference_period_end).toBe(
			"SUIT: Seconde_declaration.Periode_reference_fin",
		);
	});

	it("annotates company identity columns exposed by SUIT", () => {
		const company = SCHEMA_COLUMN_COMMENTS.company;
		expect(company?.name).toBe("SUIT: Raison_sociale");
		expect(company?.workforce).toBe("SUIT: Effectif");
		expect(company?.naf_code).toBe("SUIT: Code_NAF");
		expect(company?.address).toBe("SUIT: Adresse");
		expect(company?.has_cse).toBe("SUIT: CSE_existant");
	});

	it("annotates declarant columns exposed by SUIT", () => {
		const user = SCHEMA_COLUMN_COMMENTS.user;
		expect(user?.first_name).toBe("SUIT: Declarant.Prenom");
		expect(user?.last_name).toBe("SUIT: Declarant.Nom");
		expect(user?.email).toBe("SUIT: Declarant.Email");
		expect(user?.phone).toBe("SUIT: Declarant.Telephone");
	});

	it("annotates CSE opinion columns exposed by SUIT", () => {
		const cse = SCHEMA_COLUMN_COMMENTS.cse_opinion;
		expect(cse?.declaration_number).toBe("SUIT: Avis_CSE.Numero_declaration");
		expect(cse?.type).toBe("SUIT: Avis_CSE.Type");
		expect(cse?.opinion).toBe("SUIT: Avis_CSE.Avis");
		expect(cse?.opinion_date).toBe("SUIT: Avis_CSE.Date");
	});

	it("annotates file columns exposed by SUIT", () => {
		const file = SCHEMA_COLUMN_COMMENTS.file;
		expect(file?.id).toBe("SUIT: Fichiers_CSE.Id");
		expect(file?.file_name).toBe("SUIT: Fichiers_CSE.Nom_fichier");
		expect(file?.uploaded_at).toBe("SUIT: Fichiers_CSE.Date_upload");
	});

	it("does not annotate file_path (not exposed in SUIT JSON)", () => {
		expect(SCHEMA_COLUMN_COMMENTS.file?.file_path).toBeUndefined();
	});

	it("annotates indicator G job_category columns without GIP-MDS prefix", () => {
		const jobCat = SCHEMA_COLUMN_COMMENTS.job_category;
		expect(jobCat?.name).toBe("SUIT: Indicateurs.G.Nom_categorie");
		expect(jobCat?.detail).toBe("SUIT: Indicateurs.G.Detail_categorie");
	});

	it("does not annotate job_category internal columns (not in SUIT JSON)", () => {
		expect(SCHEMA_COLUMN_COMMENTS.job_category?.category_index).toBeUndefined();
		expect(SCHEMA_COLUMN_COMMENTS.job_category?.source).toBeUndefined();
	});

	it("annotates all indicator G employee_category columns without GIP-MDS prefix", () => {
		const empCat = SCHEMA_COLUMN_COMMENTS.employee_category;
		expect(empCat?.women_count).toBe("SUIT: Indicateurs.G.Effectif_F");
		expect(empCat?.men_count).toBe("SUIT: Indicateurs.G.Effectif_H");
		expect(empCat?.annual_base_women).toBe(
			"SUIT: Indicateurs.G.Rem_annuelle_base_F",
		);
		expect(empCat?.annual_base_men).toBe(
			"SUIT: Indicateurs.G.Rem_annuelle_base_H",
		);
		expect(empCat?.annual_variable_women).toBe(
			"SUIT: Indicateurs.G.Rem_annuelle_variable_F",
		);
		expect(empCat?.annual_variable_men).toBe(
			"SUIT: Indicateurs.G.Rem_annuelle_variable_H",
		);
		expect(empCat?.hourly_base_women).toBe(
			"SUIT: Indicateurs.G.Taux_horaire_base_F",
		);
		expect(empCat?.hourly_base_men).toBe(
			"SUIT: Indicateurs.G.Taux_horaire_base_H",
		);
		expect(empCat?.hourly_variable_women).toBe(
			"SUIT: Indicateurs.G.Taux_horaire_variable_F",
		);
		expect(empCat?.hourly_variable_men).toBe(
			"SUIT: Indicateurs.G.Taux_horaire_variable_H",
		);
	});

	it("uses SUIT prefix (not GIP-MDS) for all T2 entries", () => {
		const allComments = Object.values(SCHEMA_COLUMN_COMMENTS).flatMap((table) =>
			Object.values(table),
		);
		for (const comment of allComments) {
			expect(comment).toMatch(/^SUIT: /);
			expect(comment).not.toContain("GIP-MDS");
		}
	});
});
