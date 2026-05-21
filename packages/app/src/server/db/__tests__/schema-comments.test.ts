import { describe, expect, it } from "vitest";
import {
	INDICATOR_A_GAP_LABELS,
	INDICATOR_A_LABELS,
	INDICATOR_B_GAP_LABELS,
	INDICATOR_B_LABELS,
	INDICATOR_C_GAP_LABELS,
	INDICATOR_C_LABELS,
	INDICATOR_D_GAP_LABELS,
	INDICATOR_D_LABELS,
	INDICATOR_E_LABELS,
	INDICATOR_E_PROPORTION_LABELS,
	INDICATOR_F_ANNUAL_MEN_LABELS,
	INDICATOR_F_ANNUAL_THRESHOLD_LABELS,
	INDICATOR_F_ANNUAL_WOMEN_LABELS,
	INDICATOR_F_HOURLY_MEN_LABELS,
	INDICATOR_F_HOURLY_THRESHOLD_LABELS,
	INDICATOR_F_HOURLY_WOMEN_LABELS,
} from "~/modules/export/shared/apiLabels";
import { SCHEMA_COLUMN_COMMENTS } from "../schema-comments";

const ALL_SUIT_LABELS: readonly string[] = [
	...Object.values(INDICATOR_A_LABELS),
	...Object.values(INDICATOR_B_LABELS),
	...Object.values(INDICATOR_C_LABELS),
	...Object.values(INDICATOR_D_LABELS),
	...Object.values(INDICATOR_E_LABELS),
	...INDICATOR_F_ANNUAL_THRESHOLD_LABELS,
	...INDICATOR_F_ANNUAL_WOMEN_LABELS,
	...INDICATOR_F_ANNUAL_MEN_LABELS,
	...INDICATOR_F_HOURLY_THRESHOLD_LABELS,
	...INDICATOR_F_HOURLY_WOMEN_LABELS,
	...INDICATOR_F_HOURLY_MEN_LABELS,
];

const T3_GAP_PROPORTION_COLUMNS: ReadonlyArray<[string, string]> = [
	["global_annual_mean_gap", INDICATOR_A_GAP_LABELS.annual],
	["global_hourly_mean_gap", INDICATOR_A_GAP_LABELS.hourly],
	["variable_annual_mean_gap", INDICATOR_B_GAP_LABELS.annual],
	["variable_hourly_mean_gap", INDICATOR_B_GAP_LABELS.hourly],
	["global_annual_median_gap", INDICATOR_C_GAP_LABELS.annual],
	["global_hourly_median_gap", INDICATOR_C_GAP_LABELS.hourly],
	["variable_annual_median_gap", INDICATOR_D_GAP_LABELS.annual],
	["variable_hourly_median_gap", INDICATOR_D_GAP_LABELS.hourly],
	["variable_proportion_women", INDICATOR_E_PROPORTION_LABELS.women],
	["variable_proportion_men", INDICATOR_E_PROPORTION_LABELS.men],
];

describe("SCHEMA_COLUMN_COMMENTS", () => {
	const declarationComments = SCHEMA_COLUMN_COMMENTS.declaration;

	// ── T2 tests (PR #3312 — SUIT meta columns) ──────────────────────────────

	it("annotates declaration.siren as SUIT: SIREN (S1)", () => {
		expect(SCHEMA_COLUMN_COMMENTS.declaration?.siren).toBe("SUIT: SIREN");
	});

	it("annotates all declaration meta columns exposed by SUIT", () => {
		const decl = SCHEMA_COLUMN_COMMENTS.declaration;
		expect(decl?.year).toBe("SUIT: Annee");
		expect(decl?.status).toBe("SUIT: Statut");
		expect(decl?.first_declaration_path_choice).toBe(
			"SUIT: Parcours_apres_declaration_1",
		);
		expect(decl?.second_declaration_path_choice).toBe(
			"SUIT: Parcours_apres_declaration_2",
		);
		expect(decl?.cse_required).toBe("SUIT: Avis_CSE_requis");
		expect(decl?.rules_version).toBe("SUIT: Version_regles");
		expect(decl?.total_women).toBe("SUIT: Effectif_F_rem_annuelle_globale");
		expect(decl?.total_men).toBe("SUIT: Effectif_H_rem_annuelle_globale");
		expect(decl?.created_at).toBe("SUIT: Date_creation");
		expect(decl?.updated_at).toBe("SUIT: Date_modification");
	});

	it("annotates second declaration columns", () => {
		const decl = SCHEMA_COLUMN_COMMENTS.declaration;
		expect(decl?.second_decl_reference_period_start).toBe(
			"SUIT: Seconde_declaration.Periode_reference_debut",
		);
		expect(decl?.second_decl_reference_period_end).toBe(
			"SUIT: Seconde_declaration.Periode_reference_fin",
		);
	});

	it("annotates declaration_status_history columns (T8 — event-sourced history)", () => {
		const hist = SCHEMA_COLUMN_COMMENTS.declaration_status_history;
		expect(hist?.declaration_id).toMatch(/Référence vers la déclaration/);
		expect(hist?.event_type).toMatch(/Type d'event métier/);
		expect(hist?.value).toMatch(/Charge utile/);
		expect(hist?.round).toMatch(/première déclaration/);
		expect(hist?.actor_user_id).toMatch(/Auteur de l'event/);
		expect(hist?.created_at).toMatch(/Timestamp d'émission/);
	});

	it("does not annotate dropped legacy columns (T8 — event sourcing)", () => {
		const decl = SCHEMA_COLUMN_COMMENTS.declaration;
		expect(decl?.submitted_at).toBeUndefined();
		expect(decl?.first_declaration_path_choice_at).toBeUndefined();
		expect(decl?.second_declaration_path_choice_at).toBeUndefined();
		expect(decl?.second_declaration_submitted_at).toBeUndefined();
		expect(decl?.joint_evaluation_submitted_at).toBeUndefined();
		expect(decl?.cse_opinion_completed_at).toBeUndefined();
		expect(decl?.demarche_completed_at).toBeUndefined();
		expect(decl?.phase2_required).toBeUndefined();
		expect(decl?.phase2_revision_required).toBeUndefined();
		expect(decl?.indicator_g_required).toBeUndefined();
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
		// Scoped to T2 tables only. The `declaration` table is excluded because T1
		// (PR #3312) populates it with `GIP-MDS | SUIT: ...` indicator A–F entries;
		// the T2 keys inside `declaration` are already validated verbatim by the
		// per-key tests above ("annotates all declaration meta columns…",
		// "annotates second declaration columns").
		const t2Tables = [
			"company",
			"user",
			"cse_opinion",
			"file",
			"job_category",
			"employee_category",
		] as const;
		const allComments = t2Tables.flatMap((table) =>
			Object.values(SCHEMA_COLUMN_COMMENTS[table] ?? {}),
		);
		for (const comment of allComments) {
			expect(comment).toMatch(/^SUIT: /);
			expect(comment).not.toContain("GIP-MDS");
		}
	});

	// ── T1 tests (PR #3313 — Indicators A–F GIP-MDS | SUIT) ──────────────────

	it("defines a declaration entry", () => {
		expect(declarationComments).toBeDefined();
		expect(typeof declarationComments).toBe("object");
	});

	it("annotates all indicator A–E columns (18 columns)", () => {
		const aToEColumns = Object.keys(declarationComments ?? {}).filter((k) =>
			/^indicator_[a-e]_/.test(k),
		);
		expect(aToEColumns).toHaveLength(18);
	});

	it("annotates all indicator F columns (22 columns)", () => {
		const fColumns = Object.keys(declarationComments ?? {}).filter((k) =>
			k.startsWith("indicator_f_"),
		);
		expect(fColumns).toHaveLength(22);
	});

	it("uses the strict format 'GIP-MDS | SUIT: <label>' for every indicator A–F comment", () => {
		// Scoped to T1 columns only (`indicator_*`). T2 columns within `declaration`
		// (siren, year, total_women, etc.) use the `SUIT: ...` format and are
		// validated by the T2 tests above.
		const t1Entries = Object.entries(declarationComments ?? {}).filter(
			([col]) => /^indicator_[a-f]_/.test(col),
		);
		for (const [column, comment] of t1Entries) {
			expect(comment, `column ${column}`).toMatch(/^GIP-MDS \| SUIT: .+$/);
		}
	});

	it("uses each SUIT label verbatim, exactly once (S4)", () => {
		// Scoped to T1 columns only (`indicator_*`). T2 columns inside `declaration`
		// (siren, year, total_women, …) use the bare `SUIT: …` format and are
		// validated by the T2 per-key tests above.
		const t1Entries = Object.entries(declarationComments ?? {}).filter(
			([col]) => /^indicator_[a-f]_/.test(col),
		);
		const t1CommentValues = t1Entries.map(([, v]) =>
			v.replace("GIP-MDS | SUIT: ", ""),
		);

		const labelSet = new Set(ALL_SUIT_LABELS);

		for (const label of ALL_SUIT_LABELS) {
			const occurrences = t1CommentValues.filter((v) => v === label).length;
			expect(occurrences, `label "${label}"`).toBe(1);
		}

		// Reverse check: every T1 value in the map must be a known canonical label.
		// Catches typos that pass the format regex but aren't in apiLabels.ts.
		for (const [column, value] of t1Entries) {
			const label = value.replace("GIP-MDS | SUIT: ", "");
			expect(
				labelSet.has(label),
				`column "${column}" has unknown label "${label}"`,
			).toBe(true);
		}
	});

	// ── T3 tests (T3 — gap + proportion E columns) ────────────────────────────

	it("annotates all 10 T3 gap and proportion E columns with their SUIT labels", () => {
		const decl = SCHEMA_COLUMN_COMMENTS.declaration;
		for (const [column, expectedLabel] of T3_GAP_PROPORTION_COLUMNS) {
			expect(decl?.[column], `column "${column}"`).toBe(
				`GIP-MDS | SUIT: ${expectedLabel}`,
			);
		}
	});

	it("uses verbatim CSV labels for all T3 gap and proportion E columns (naming check)", () => {
		for (const [, label] of T3_GAP_PROPORTION_COLUMNS) {
			expect(label).toMatch(/^(Rem_|Taux_|Proportion_)/);
		}
	});
});
