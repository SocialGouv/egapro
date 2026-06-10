import { describe, expect, it } from "vitest";
import {
	buildAssociationMap,
	buildColumnId,
	clearFileAssociations,
	computeContentTypeColumns,
	getMissingColumns,
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

describe("computeContentTypeColumns", () => {
	it("returns only the first-declaration accuracy column when there is a single declaration without consulted gap (S1)", () => {
		const columns = computeContentTypeColumns({
			hasSecondDeclaration: false,
			firstDeclGapConsulted: false,
			secondDeclGapConsulted: null,
			firstDeclGapHigh: false,
			secondDeclGapHigh: false,
		});

		expect(columns.map((column) => column.id)).toEqual(["1:accuracy"]);
		expect(columns[0]?.label).toBe("Exactitude");
		expect(columns[0]?.declarationLabel).toBeNull();
	});

	it("adds the first-declaration gap column without declaration suffix when the gap was consulted on a single declaration (S2)", () => {
		const columns = computeContentTypeColumns({
			hasSecondDeclaration: false,
			firstDeclGapConsulted: true,
			secondDeclGapConsulted: null,
			firstDeclGapHigh: true,
			secondDeclGapHigh: false,
		});

		expect(columns.map((column) => column.id)).toEqual(["1:accuracy", "1:gap"]);
		expect(columns.every((column) => column.declarationLabel === null)).toBe(
			true,
		);
		expect(columns[1]?.label).toBe("Justification");
	});

	it("builds the four columns with declaration suffixes when both declarations consulted their gap (S3)", () => {
		const columns = computeContentTypeColumns({
			hasSecondDeclaration: true,
			firstDeclGapConsulted: true,
			secondDeclGapConsulted: true,
			firstDeclGapHigh: true,
			secondDeclGapHigh: true,
		});

		expect(columns.map((column) => column.id)).toEqual([
			"1:accuracy",
			"1:gap",
			"2:accuracy",
			"2:gap",
		]);
		expect(columns[0]?.declarationLabel).toBe("1re déclaration");
		expect(columns[2]?.declarationLabel).toBe("2e déclaration");
	});

	it("hides the second-declaration gap column when the second gap was not consulted (S4)", () => {
		const columns = computeContentTypeColumns({
			hasSecondDeclaration: true,
			firstDeclGapConsulted: true,
			secondDeclGapConsulted: false,
			firstDeclGapHigh: true,
			secondDeclGapHigh: true,
		});

		expect(columns.map((column) => column.id)).toEqual([
			"1:accuracy",
			"1:gap",
			"2:accuracy",
		]);
	});

	it("hides the first-declaration gap column when consulted but there is no gap >= 5%", () => {
		const columns = computeContentTypeColumns({
			hasSecondDeclaration: false,
			firstDeclGapConsulted: true,
			secondDeclGapConsulted: null,
			firstDeclGapHigh: false,
			secondDeclGapHigh: false,
		});

		expect(columns.map((column) => column.id)).toEqual(["1:accuracy"]);
	});

	it("hides the second-declaration gap column when consulted but there is no gap >= 5% on the second declaration", () => {
		const columns = computeContentTypeColumns({
			hasSecondDeclaration: true,
			firstDeclGapConsulted: true,
			secondDeclGapConsulted: true,
			firstDeclGapHigh: true,
			secondDeclGapHigh: false,
		});

		expect(columns.map((column) => column.id)).toEqual([
			"1:accuracy",
			"1:gap",
			"2:accuracy",
		]);
	});

	it("hides the first-declaration gap column when the first gap was not consulted but the second was", () => {
		const columns = computeContentTypeColumns({
			hasSecondDeclaration: true,
			firstDeclGapConsulted: false,
			secondDeclGapConsulted: true,
			firstDeclGapHigh: true,
			secondDeclGapHigh: true,
		});

		expect(columns.map((column) => column.id)).toEqual([
			"1:accuracy",
			"2:accuracy",
			"2:gap",
		]);
	});

	it("treats a null gapConsulted as not consulted", () => {
		const columns = computeContentTypeColumns({
			hasSecondDeclaration: true,
			firstDeclGapConsulted: null,
			secondDeclGapConsulted: null,
			firstDeclGapHigh: true,
			secondDeclGapHigh: true,
		});

		expect(columns.map((column) => column.id)).toEqual([
			"1:accuracy",
			"2:accuracy",
		]);
	});

	it("includes the ordinal in the missing message only when a second declaration exists", () => {
		const single = computeContentTypeColumns({
			hasSecondDeclaration: false,
			firstDeclGapConsulted: true,
			secondDeclGapConsulted: null,
			firstDeclGapHigh: true,
			secondDeclGapHigh: false,
		});
		const dual = computeContentTypeColumns({
			hasSecondDeclaration: true,
			firstDeclGapConsulted: true,
			secondDeclGapConsulted: true,
			firstDeclGapHigh: true,
			secondDeclGapHigh: true,
		});

		expect(single[0]?.missingMessage).toBe(
			"Ajoutez l'avis d'exactitude des données et des méthodes de calcul, ou indiquez s'il est déjà inclus dans l'un des fichiers déposés.",
		);
		expect(dual[3]?.missingMessage).toBe(
			"Ajoutez l'avis justifiant les écarts ≥ 5 % de la deuxième déclaration, ou indiquez s'il est déjà inclus dans l'un des fichiers déposés.",
		);
	});

	it("exposes a distinct description per accuracy column and a shared gap description", () => {
		const columns = computeContentTypeColumns({
			hasSecondDeclaration: true,
			firstDeclGapConsulted: true,
			secondDeclGapConsulted: true,
			firstDeclGapHigh: true,
			secondDeclGapHigh: true,
		});

		expect(columns[0]?.description).toContain("l'ensemble des indicateurs");
		expect(columns[2]?.description).toContain("la seconde déclaration");
		expect(columns[1]?.description).toBe(columns[3]?.description);
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
