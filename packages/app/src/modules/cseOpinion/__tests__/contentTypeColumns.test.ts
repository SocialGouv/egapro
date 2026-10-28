import { describe, expect, it } from "vitest";
import type { GapJustification } from "~/modules/domain";
import {
	buildAssociationMap,
	buildColumnId,
	clearFileAssociations,
	computeContentTypeColumns,
	computeJustificationRequirements,
	computeRequiredContentTypes,
	DECLARATION_HEADINGS,
	getMissingColumns,
	getMissingOpinionMessage,
	getOpinionTitle,
	getSingleChoiceAssociation,
	getUnassociatedFiles,
	toAssociationPayload,
} from "../contentTypeColumns";
import type {
	AssociationMap,
	ContentTypeColumn,
	StoredFileContentType,
} from "../types";

describe("buildColumnId", () => {
	it("joins the declaration number and the type with a colon", () => {
		expect(buildColumnId(1, "accuracy")).toBe("1:accuracy");
		expect(buildColumnId(2, "gap")).toBe("2:gap");
	});
});

type Parcours = {
	case: number;
	first: GapJustification | "no_gap";
	second?: GapJustification | "no_gap";
	expected: string[];
};

const PARCOURS: Parcours[] = [
	{ case: 1, first: "no_gap", expected: ["1:accuracy"] },
	{ case: 2, first: "all", expected: ["1:accuracy", "1:gap"] },
	{ case: 3, first: "partial", expected: ["1:accuracy", "1:gap"] },
	{ case: 4, first: "none", expected: ["1:accuracy"] },
	{
		case: 5,
		first: "partial",
		second: "no_gap",
		expected: ["1:accuracy", "1:gap", "2:accuracy"],
	},
	{
		case: 6,
		first: "partial",
		second: "all",
		expected: ["1:accuracy", "1:gap", "2:accuracy", "2:gap"],
	},
	{
		case: 7,
		first: "partial",
		second: "partial",
		expected: ["1:accuracy", "1:gap", "2:accuracy", "2:gap"],
	},
	{
		case: 8,
		first: "partial",
		second: "none",
		expected: ["1:accuracy", "1:gap", "2:accuracy"],
	},
	{
		case: 9,
		first: "none",
		second: "no_gap",
		expected: ["1:accuracy", "2:accuracy"],
	},
	{
		case: 10,
		first: "none",
		second: "all",
		expected: ["1:accuracy", "2:accuracy", "2:gap"],
	},
	{
		case: 11,
		first: "none",
		second: "partial",
		expected: ["1:accuracy", "2:accuracy", "2:gap"],
	},
	{
		case: 12,
		first: "none",
		second: "none",
		expected: ["1:accuracy", "2:accuracy"],
	},
];

function toDeclarationFacts(qualification: Parcours["first"] | undefined) {
	if (qualification === undefined || qualification === "no_gap") {
		return { gapHigh: false, gapJustification: null };
	}
	return { gapHigh: true, gapJustification: qualification };
}

describe("computeRequiredContentTypes — the 12 parcours of the ticket", () => {
	it.each(PARCOURS)("requires exactly the opinions of case $case", ({
		first,
		second,
		expected,
	}) => {
		const firstFacts = toDeclarationFacts(first);
		const secondFacts = toDeclarationFacts(second);
		const required = computeRequiredContentTypes({
			hasSecondDeclaration: second !== undefined,
			...computeJustificationRequirements({
				firstDeclarationGapJustification: firstFacts.gapJustification,
				secondDeclarationGapJustification: secondFacts.gapJustification,
				firstDeclGapHigh: firstFacts.gapHigh,
				secondDeclGapHigh: secondFacts.gapHigh,
			}),
		});

		expect(
			required.map((spec) => buildColumnId(spec.declarationNumber, spec.type)),
		).toEqual(expected);
	});
});

describe("computeJustificationRequirements", () => {
	it("requires no justification when no qualification was stored", () => {
		expect(
			computeJustificationRequirements({
				firstDeclarationGapJustification: null,
				secondDeclarationGapJustification: null,
				firstDeclGapHigh: true,
				secondDeclGapHigh: true,
			}),
		).toEqual({
			firstDeclJustificationRequired: false,
			secondDeclJustificationRequired: false,
		});
	});

	it("drops a qualification that survived the disappearance of the gap", () => {
		expect(
			computeJustificationRequirements({
				firstDeclarationGapJustification: "all",
				secondDeclarationGapJustification: "partial",
				firstDeclGapHigh: false,
				secondDeclGapHigh: true,
			}),
		).toEqual({
			firstDeclJustificationRequired: false,
			secondDeclJustificationRequired: true,
		});
	});
});

describe("computeContentTypeColumns", () => {
	it("returns only the first-declaration accuracy column without declaration label on a single declaration", () => {
		const columns = computeContentTypeColumns({
			hasSecondDeclaration: false,
			firstDeclJustificationRequired: false,
			secondDeclJustificationRequired: false,
		});

		expect(columns.map((column) => column.id)).toEqual(["1:accuracy"]);
		expect(columns[0]?.label).toBe("Exactitude");
		expect(columns[0]?.declarationLabel).toBeNull();
	});

	it("ignores the second-declaration requirement while there is no second declaration", () => {
		const columns = computeContentTypeColumns({
			hasSecondDeclaration: false,
			firstDeclJustificationRequired: true,
			secondDeclJustificationRequired: true,
		});

		expect(columns.map((column) => column.id)).toEqual(["1:accuracy", "1:gap"]);
		expect(columns[1]?.label).toBe("Justification");
	});

	it("labels each column with its declaration when there are two", () => {
		const columns = computeContentTypeColumns({
			hasSecondDeclaration: true,
			firstDeclJustificationRequired: true,
			secondDeclJustificationRequired: true,
		});

		expect(columns[0]?.declarationLabel).toBe("1re déclaration");
		expect(columns[2]?.declarationLabel).toBe("2e déclaration");
	});

	it("includes the ordinal in the missing message only when a second declaration exists", () => {
		const single = computeContentTypeColumns({
			hasSecondDeclaration: false,
			firstDeclJustificationRequired: true,
			secondDeclJustificationRequired: false,
		});
		const dual = computeContentTypeColumns({
			hasSecondDeclaration: true,
			firstDeclJustificationRequired: true,
			secondDeclJustificationRequired: true,
		});

		expect(single[0]?.missingMessage).toBe(
			"Ajoutez l'avis d'exactitude des données et des méthodes de calcul, ou indiquez s'il est déjà inclus dans l'un des fichiers déposés.",
		);
		expect(dual[3]?.missingMessage).toBe(
			"Ajoutez l'avis justifiant les écarts ≥ 5 % de la seconde déclaration, ou indiquez s'il est déjà inclus dans l'un des fichiers déposés.",
		);
	});

	it("describes each column with the title of its step 1 card", () => {
		const columns = computeContentTypeColumns({
			hasSecondDeclaration: true,
			firstDeclJustificationRequired: true,
			secondDeclJustificationRequired: true,
		});

		expect(columns.map((column) => column.description)).toEqual([
			getOpinionTitle(1, "accuracy"),
			getOpinionTitle(1, "gap"),
			getOpinionTitle(2, "accuracy"),
			getOpinionTitle(2, "gap"),
		]);
	});
});

describe("getOpinionTitle", () => {
	it("words each opinion as the mock-up does", () => {
		expect(getOpinionTitle(1, "accuracy")).toBe(
			"Exactitude des données utilisées pour le calcul, la méthode de calcul et les résultats de chaque indicateur.",
		);
		expect(getOpinionTitle(2, "accuracy")).toBe(
			"Exactitude des données utilisées pour le calcul, la méthode de calcul et les résultats de la seconde déclaration de l'indicateur par catégorie d'emplois.",
		);
		expect(getOpinionTitle(2, "gap")).toBe(
			"Justification des écarts ≥ 5 % par des critères objectifs et non fondés sur le sexe de l'indicateur par catégorie d'emplois.",
		);
	});

	it("heads the declarations as first and second", () => {
		expect(DECLARATION_HEADINGS).toEqual({
			1: "Première déclaration",
			2: "Seconde déclaration",
		});
	});
});

describe("getMissingOpinionMessage", () => {
	it("names the second declaration as the seconde", () => {
		expect(
			getMissingOpinionMessage(
				{ declarationNumber: 2, type: "accuracy" },
				true,
			),
		).toBe(
			"Ajoutez l'avis d'exactitude des données et des méthodes de calcul de la seconde déclaration, ou indiquez s'il est déjà inclus dans l'un des fichiers déposés.",
		);
	});
});

function columns(
	...ids: Array<[1 | 2, "accuracy" | "gap"]>
): ContentTypeColumn[] {
	return ids.map(([declarationNumber, type]) => ({
		id: buildColumnId(declarationNumber, type),
		declarationNumber,
		type,
		label: type === "accuracy" ? "Exactitude" : "Justification",
		declarationLabel: null,
		description: "",
		missingMessage: "",
	}));
}

describe("buildAssociationMap", () => {
	it("initialises every column to null", () => {
		const map = buildAssociationMap(columns([1, "accuracy"], [1, "gap"]), []);

		expect(map).toEqual({ "1:accuracy": null, "1:gap": null });
	});

	it("applies stored associations whose column exists", () => {
		const stored: StoredFileContentType[] = [
			{ declarationNumber: 1, type: "accuracy", fileId: "file-a" },
			{ declarationNumber: 1, type: "gap", fileId: "file-b" },
		];

		const map = buildAssociationMap(
			columns([1, "accuracy"], [1, "gap"]),
			stored,
		);

		expect(map).toEqual({ "1:accuracy": "file-a", "1:gap": "file-b" });
	});

	it("ignores stored associations that target a column not currently displayed", () => {
		const stored: StoredFileContentType[] = [
			{ declarationNumber: 2, type: "gap", fileId: "stale" },
		];

		const map = buildAssociationMap(columns([1, "accuracy"]), stored);

		expect(map).toEqual({ "1:accuracy": null });
	});
});

describe("toAssociationPayload", () => {
	it("keeps only columns that point to a file", () => {
		const cols = columns([1, "accuracy"], [1, "gap"], [2, "accuracy"]);
		const map: AssociationMap = {
			"1:accuracy": "file-a",
			"1:gap": null,
			"2:accuracy": "file-a",
		};

		expect(toAssociationPayload(cols, map)).toEqual([
			{ declarationNumber: 1, type: "accuracy", fileId: "file-a" },
			{ declarationNumber: 2, type: "accuracy", fileId: "file-a" },
		]);
	});

	it("returns an empty payload when no column is associated", () => {
		const cols = columns([1, "accuracy"]);

		expect(toAssociationPayload(cols, { "1:accuracy": null })).toEqual([]);
	});
});

describe("getMissingColumns", () => {
	it("returns the columns that have no associated file", () => {
		const cols = columns([1, "accuracy"], [1, "gap"]);
		const map: AssociationMap = { "1:accuracy": "file-a", "1:gap": null };

		expect(getMissingColumns(cols, map).map((column) => column.id)).toEqual([
			"1:gap",
		]);
	});

	it("returns an empty list when every column is filled", () => {
		const cols = columns([1, "accuracy"]);

		expect(getMissingColumns(cols, { "1:accuracy": "file-a" })).toEqual([]);
	});
});

describe("getUnassociatedFiles", () => {
	const files = [{ id: "file-a" }, { id: "file-b" }, { id: "file-c" }];

	it("returns files whose id is not referenced by any column", () => {
		const map: AssociationMap = {
			"1:accuracy": "file-a",
			"1:gap": null,
			"2:accuracy": "file-c",
		};

		expect(getUnassociatedFiles(files, map).map((file) => file.id)).toEqual([
			"file-b",
		]);
	});

	it("returns an empty list when every file is associated to at least one column", () => {
		const map: AssociationMap = {
			"1:accuracy": "file-a",
			"1:gap": "file-b",
			"2:accuracy": "file-c",
		};

		expect(getUnassociatedFiles(files, map)).toEqual([]);
	});

	it("returns every file when the map is empty", () => {
		expect(getUnassociatedFiles(files, {}).map((file) => file.id)).toEqual([
			"file-a",
			"file-b",
			"file-c",
		]);
	});
});

describe("clearFileAssociations", () => {
	it("nulls every column pointing to the removed file and keeps the others", () => {
		const map: AssociationMap = {
			"1:accuracy": "file-a",
			"1:gap": "file-b",
			"2:accuracy": "file-a",
		};

		expect(clearFileAssociations(map, "file-a")).toEqual({
			"1:accuracy": null,
			"1:gap": "file-b",
			"2:accuracy": null,
		});
	});

	it("leaves the map unchanged when the file is not associated", () => {
		const map: AssociationMap = { "1:accuracy": "file-a", "1:gap": null };

		expect(clearFileAssociations(map, "file-z")).toEqual({
			"1:accuracy": "file-a",
			"1:gap": null,
		});
	});
});

describe("getSingleChoiceAssociation", () => {
	const singleDeclarationInput = {
		hasSecondDeclaration: false,
		firstDeclJustificationRequired: false,
		secondDeclJustificationRequired: false,
	};

	it("pairs the only column with the only file when the parcours requires the first-declaration accuracy opinion alone", () => {
		const columns = computeContentTypeColumns(singleDeclarationInput);

		expect(getSingleChoiceAssociation(columns, [{ id: "file-a" }])).toEqual({
			columnId: "1:accuracy",
			fileId: "file-a",
		});
	});

	it("returns null while no file has been uploaded", () => {
		const columns = computeContentTypeColumns(singleDeclarationInput);

		expect(getSingleChoiceAssociation(columns, [])).toBeNull();
	});

	it("returns null when a second declaration adds a column", () => {
		const columns = computeContentTypeColumns({
			...singleDeclarationInput,
			hasSecondDeclaration: true,
		});

		expect(getSingleChoiceAssociation(columns, [{ id: "file-a" }])).toBeNull();
	});

	it("returns null when the first declaration also requires a gap justification", () => {
		const columns = computeContentTypeColumns({
			...singleDeclarationInput,
			firstDeclJustificationRequired: true,
		});

		expect(getSingleChoiceAssociation(columns, [{ id: "file-a" }])).toBeNull();
	});

	it("returns null when several files are present", () => {
		const columns = computeContentTypeColumns(singleDeclarationInput);

		expect(
			getSingleChoiceAssociation(columns, [{ id: "file-a" }, { id: "file-b" }]),
		).toBeNull();
	});
});
