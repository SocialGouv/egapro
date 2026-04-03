import { describe, expect, it } from "vitest";

import { DEFAULT_CATEGORIES } from "~/modules/declaration-remuneration/types";
import { generateTemplate, parseImportFile } from "../categoryImportExport";
import type { EmployeeCategory } from "../categorySerializer";

function makeCategory(
	id: number,
	name: string,
	overrides: Partial<EmployeeCategory> = {},
): EmployeeCategory {
	return {
		id,
		name,
		detail: "",
		womenCount: "",
		menCount: "",
		annualBaseWomen: "",
		annualBaseMen: "",
		annualVariableWomen: "",
		annualVariableMen: "",
		hourlyBaseWomen: "",
		hourlyBaseMen: "",
		hourlyVariableWomen: "",
		hourlyVariableMen: "",
		...overrides,
	};
}

describe("generateTemplate", () => {
	it("generates an XLSX blob with default categories when form is empty", async () => {
		const blob = await generateTemplate([], "xlsx");
		expect(blob).toBeInstanceOf(Blob);
		expect(blob.type).toContain("spreadsheet");
		expect(blob.size).toBeGreaterThan(0);
	});

	it("generates a CSV blob with default categories when form is empty", async () => {
		const blob = await generateTemplate([], "csv");
		expect(blob).toBeInstanceOf(Blob);
		expect(blob.type).toContain("csv");

		const text = await blob.text();
		const lines = text.replace(/^\uFEFF/, "").split("\n");
		expect(lines.length).toBe(DEFAULT_CATEGORIES.length + 1);
		expect(lines[0]).toContain("Nom de la catégorie");
		expect(lines[1]).toContain("Ouvriers");
	});

	it("generates a CSV with current categories data", async () => {
		const categories = [
			makeCategory(0, "Cadres", {
				detail: "Direction",
				womenCount: "10",
				menCount: "15",
				annualBaseWomen: "45000.50",
			}),
		];

		const blob = await generateTemplate(categories, "csv");
		const text = await blob.text();
		const lines = text.replace(/^\uFEFF/, "").split("\n");

		expect(lines.length).toBe(2);
		expect(lines[1]).toContain("Cadres");
		expect(lines[1]).toContain("Direction");
		expect(lines[1]).toContain("10");
		expect(lines[1]).toContain("45000.50");
	});
});

describe("parseImportFile — XLSX", () => {
	it("round-trips: generate then parse XLSX", async () => {
		const original = [
			makeCategory(0, "Ouvriers", {
				detail: "Production",
				womenCount: "50",
				menCount: "60",
				annualBaseWomen: "30000",
				annualBaseMen: "31000",
			}),
			makeCategory(1, "Cadres", {
				womenCount: "20",
				menCount: "25",
			}),
		];

		const blob = await generateTemplate(original, "xlsx");
		const file = new File([blob], "test.xlsx", { type: blob.type });
		const result = await parseImportFile(file);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.categories).toHaveLength(2);
		expect(result.categories[0]?.name).toBe("Ouvriers");
		expect(result.categories[0]?.detail).toBe("Production");
		expect(result.categories[0]?.womenCount).toBe("50");
		expect(result.categories[0]?.annualBaseWomen).toBe("30000");
		expect(result.categories[1]?.name).toBe("Cadres");
		expect(result.categories[1]?.womenCount).toBe("20");
	});
});

describe("parseImportFile — CSV", () => {
	function csvFile(content: string, name = "test.csv"): File {
		return new File([content], name, { type: "text/csv" });
	}

	const headers =
		"Nom de la catégorie;Détail des emplois;Effectif femmes;Effectif hommes;Annuel base femmes (€);Annuel base hommes (€);Annuel variable femmes (€);Annuel variable hommes (€);Horaire base femmes (€);Horaire base hommes (€);Horaire variable femmes (€);Horaire variable hommes (€)";

	it("parses a valid CSV file", async () => {
		const csv = `${headers}\nOuvriers;Production;50;60;30000;31000;;;;;\nCadres;;20;25;;;;;;;;;`;
		const result = await parseImportFile(csvFile(csv));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.categories).toHaveLength(2);
		expect(result.categories[0]?.name).toBe("Ouvriers");
		expect(result.categories[0]?.womenCount).toBe("50");
		expect(result.categories[0]?.annualBaseWomen).toBe("30000");
	});

	it("normalizes comma decimals to dots", async () => {
		const csv = `${headers}\nOuvriers;;10;12;30 000,50;31000;;;;;`;
		const result = await parseImportFile(csvFile(csv));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.categories[0]?.annualBaseWomen).toBe("30000.50");
	});

	it("skips rows with empty name", async () => {
		const csv = `${headers}\nOuvriers;;10;12;;;;;;\n;;5;8;;;;;;`;
		const result = await parseImportFile(csvFile(csv));

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.categories).toHaveLength(1);
	});

	it("returns error on missing columns", async () => {
		const csv = "Nom;Effectif\nOuvriers;10";
		const result = await parseImportFile(csvFile(csv));

		expect(result.ok).toBe(false);
		if (result.ok) return;

		expect(result.errors[0]?.type).toBe("missing-columns");
		expect(result.errors[0]?.message).toContain("Colonnes manquantes");
	});

	it("returns error on empty file", async () => {
		const result = await parseImportFile(csvFile(""));

		expect(result.ok).toBe(false);
		if (result.ok) return;

		expect(result.errors[0]?.type).toBe("empty-file");
	});

	it("returns error on unsupported file format", async () => {
		const file = new File(["data"], "test.txt", { type: "text/plain" });
		const result = await parseImportFile(file);

		expect(result.ok).toBe(false);
		if (result.ok) return;

		expect(result.errors[0]?.message).toContain("Format de fichier");
	});

	it("round-trips: generate then parse CSV", async () => {
		const original = [
			makeCategory(0, "Techniciens", {
				detail: "Maintenance",
				womenCount: "30",
				menCount: "40",
				hourlyBaseWomen: "18.50",
				hourlyBaseMen: "19",
			}),
		];

		const blob = await generateTemplate(original, "csv");
		const text = await blob.text();
		const file = csvFile(text);
		const result = await parseImportFile(file);

		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.categories).toHaveLength(1);
		expect(result.categories[0]?.name).toBe("Techniciens");
		expect(result.categories[0]?.detail).toBe("Maintenance");
		expect(result.categories[0]?.hourlyBaseWomen).toBe("18.50");
	});
});
