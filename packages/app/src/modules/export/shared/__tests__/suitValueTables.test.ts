import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { opinionTypeSchema } from "~/modules/cseOpinion/schemas";
import { DECLARATION_FSM_STATUSES } from "~/modules/domain";
import {
	compliancePathEnum,
	declarationEventTypeEnum,
	fileTypeEnum,
} from "~/server/db/schema";
import {
	renderSuitValueTablesMarkdown,
	renderSuitValueTablesPage,
} from "../renderSuitValueTables";
import { getStatusHistoryLabel } from "../statusHistoryLabels";
import {
	buildSuitValueTablesPage,
	SUIT_VALUES_REGENERATE_COMMAND,
	type SuitFieldTable,
} from "../suitValueTables";

const GENERATED_PAGE = join(
	process.cwd(),
	"..",
	"..",
	"docs",
	"SUIT-API-valeurs.md",
);

const page = buildSuitValueTablesPage();

function tableFor(field: string): SuitFieldTable {
	const table = page.tables.find((candidate) => candidate.field === field);
	if (table === undefined) throw new Error(`No table for field "${field}"`);
	return table;
}

function valuesOf(field: string): string[] {
	return tableFor(field).rows.map((row) => row.value);
}

describe("buildSuitValueTablesPage", () => {
	it("covers every field the SUIT integration needs a vocabulary for", () => {
		expect(page.tables.map((table) => table.field)).toEqual([
			"Parcours.Statut",
			"Historique_statuts[].Statut",
			"Historique_statuts[].Libelle_statut",
			"Historique_statuts[].Numero_declaration",
			"Parcours_apres_declaration_1",
			"Parcours_apres_declaration_2",
			"Avis_CSE[].Type",
			"Avis_CSE[].Avis",
			"Avis_CSE[].Numero_declaration",
			"Fichiers_CSE[].Type",
			"Fichier_evaluation_conjointe.Type",
			"files[].type",
			"Source_categories_emplois",
			"Seconde_declaration.Statut",
		]);
	});

	it("gives every row a non-empty business meaning", () => {
		for (const table of page.tables) {
			expect(table.rows.length).toBeGreaterThan(0);
			for (const row of table.rows) {
				expect(row.meaning.length).toBeGreaterThan(0);
			}
		}
	});

	it("mirrors Parcours.Statut on the FSM statuses", () => {
		expect(valuesOf("Parcours.Statut")).toEqual([...DECLARATION_FSM_STATUSES]);
	});

	it("labels every FSM status with its ruleset stage, draft excepted", () => {
		const rows = tableFor("Parcours.Statut").rows;
		const draft = rows.find((row) => row.value === "draft");

		expect(draft?.label).toBeNull();
		for (const row of rows.filter((candidate) => candidate.value !== "draft")) {
			expect(row.label).not.toBeNull();
		}
	});

	it("says that draft can be exported, since cancellation does not filter on status", () => {
		const draft = tableFor("Parcours.Statut").rows.find(
			(row) => row.value === "draft",
		);

		expect(draft?.meaning).toContain("annulée");
	});

	it("mirrors Historique_statuts[].Statut on declaration_event_type minus step_change", () => {
		expect(valuesOf("Historique_statuts[].Statut")).toEqual(
			declarationEventTypeEnum.enumValues.filter(
				(value) => value !== "step_change",
			),
		);
	});

	it("lists every label getStatusHistoryLabel can produce exactly once", () => {
		const produced = [
			...declarationEventTypeEnum.enumValues
				.filter((value) => value !== "step_change")
				.map((eventType) => getStatusHistoryLabel(eventType, null)),
			...compliancePathEnum.enumValues.map((path) =>
				getStatusHistoryLabel("path_choice", path),
			),
		];
		const listed = valuesOf("Historique_statuts[].Libelle_statut");

		expect([...new Set(listed)]).toHaveLength(listed.length);
		expect([...listed].sort()).toEqual([...new Set(produced)].sort());
	});

	it("offers the three compliance paths after the first declaration", () => {
		expect(valuesOf("Parcours_apres_declaration_1")).toEqual([
			"justify",
			"corrective_action",
			"joint_evaluation",
		]);
	});

	it("never offers corrective_action after the second declaration", () => {
		expect(valuesOf("Parcours_apres_declaration_2")).toEqual([
			"justify",
			"joint_evaluation",
		]);
	});

	it("mirrors Avis_CSE[].Avis on the opinion schema", () => {
		expect(valuesOf("Avis_CSE[].Avis")).toEqual([...opinionTypeSchema.options]);
	});

	it("mirrors files[].type on the file_type enum", () => {
		expect(valuesOf("files[].type")).toEqual([...fileTypeEnum.enumValues]);
	});

	it("narrows each declaration file type to the single value its block carries", () => {
		expect(valuesOf("Fichiers_CSE[].Type")).toEqual(["cse_opinion"]);
		expect(valuesOf("Fichier_evaluation_conjointe.Type")).toEqual([
			"joint_evaluation",
		]);
	});

	it("keeps the four active job-category sources and the three historical ones", () => {
		const rows = tableFor("Source_categories_emplois").rows;

		expect(rows.map((row) => row.value)).toEqual([
			"accord-entreprise",
			"accord-groupe",
			"accord-branche",
			"decision-unilaterale",
			"convention-collective",
			"classification-interne",
			"autre",
		]);
		expect(rows.filter((row) => row.extra === "Historique")).toHaveLength(3);
	});

	it("disambiguates the homonymous field names", () => {
		expect(page.homonyms.map((homonym) => homonym.name)).toEqual([
			"Statut",
			"Type / type",
			"Numero_declaration",
			"demarche_complete / demarche_completed",
		]);
		for (const homonym of page.homonyms) {
			expect(homonym.occurrences.length).toBeGreaterThan(1);
		}
	});
});

describe("renderSuitValueTablesMarkdown", () => {
	const markdown = renderSuitValueTablesPage();

	it("opens on a do-not-edit notice naming the regeneration command", () => {
		expect(markdown.startsWith("# API SUIT")).toBe(true);
		expect(markdown).toContain("Ne pas la modifier à la main");
		expect(markdown).toContain(SUIT_VALUES_REGENERATE_COMMAND);
	});

	it("renders one heading per documented field", () => {
		for (const table of page.tables) {
			expect(markdown).toContain(`### \`${table.field}\``);
		}
	});

	it("carries no timestamp, so two runs on the same code produce the same page", () => {
		expect(renderSuitValueTablesPage()).toBe(markdown);
		expect(markdown).not.toMatch(/\d{4}-\d{2}-\d{2}/);
	});

	it("adds a column only when the tables have something to put in it", () => {
		expect(markdown).toContain(
			"| Valeur | Libellé FR | Disponibilité | Signification |",
		);
		expect(markdown).toContain("| Valeur | Libellé FR | Signification |");
		expect(markdown).toContain("| Valeur | Signification |");
	});

	it("escapes pipes so a meaning never splits its Markdown cell", () => {
		const rendered = renderSuitValueTablesMarkdown({
			...page,
			homonyms: [],
			tables: [
				{
					field: "Champ_test",
					endpoint: "GET /api/v1/export/declarations",
					description: "Description",
					presence: "Toujours présent.",
					sources: ["source"],
					extraColumn: null,
					rows: [
						{
							value: "a",
							label: null,
							extra: null,
							meaning: "gauche | droite",
						},
					],
				},
			],
		});

		expect(rendered).toContain("gauche \\| droite");
	});

	it("fills a blank cell with a dash when a row leaves a declared column empty", () => {
		const rendered = renderSuitValueTablesMarkdown({
			...page,
			homonyms: [],
			tables: [
				{
					field: "Champ_test",
					endpoint: "GET /api/v1/export/declarations",
					description: "Description",
					presence: "Toujours présent.",
					sources: ["source"],
					extraColumn: "Disponibilité",
					rows: [
						{ value: "a", label: "A", extra: null, meaning: "Sens de a." },
						{ value: "b", label: null, extra: "Active", meaning: "Sens de b." },
					],
				},
			],
		});

		expect(rendered).toContain("| `a` | A | — | Sens de a. |");
		expect(rendered).toContain("| `b` | — | Active | Sens de b. |");
	});

	it("ends on a single trailing newline", () => {
		expect(markdown.endsWith("\n")).toBe(true);
		expect(markdown.endsWith("\n\n")).toBe(false);
	});
});

describe("docs/SUIT-API-valeurs.md", () => {
	it(`is up to date — regenerate with \`${SUIT_VALUES_REGENERATE_COMMAND}\``, async () => {
		await expect(renderSuitValueTablesPage()).toMatchFileSnapshot(
			GENERATED_PAGE,
		);
	});
});
