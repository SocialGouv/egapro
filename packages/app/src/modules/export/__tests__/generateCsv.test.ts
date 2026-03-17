import { describe, expect, it } from "vitest";
import { generateCsv } from "../generateCsv";
import { CSV_COLUMNS } from "../shared/constants";
import type { ExportRow } from "../types";

function makeRow(overrides: Partial<ExportRow> = {}): ExportRow {
	return {
		siren: "123456789",
		companyName: "ACME Corp",
		workforce: 250,
		nafCode: "62.02",
		address: "1 rue de Paris, 75001 Paris",
		hasCse: true,
		year: 2027,
		status: "submitted",
		declarationType: "6_indicateurs",
		compliancePath: null,
		createdAt: "2027-03-15T10:00:00.000Z",
		updatedAt: "2027-03-15T10:00:00.000Z",
		totalWomen: 120,
		totalMen: 130,
		remunerationScore: 5,
		variableRemunerationScore: 3,
		quartileScore: 2,
		categoryScore: null,
		secondDeclarationStatus: null,
		secondDeclReferencePeriodStart: null,
		secondDeclReferencePeriodEnd: null,
		declarantFirstName: "Jean",
		declarantLastName: "Dupont",
		declarantEmail: "jean.dupont@acme.fr",
		declarantPhone: "0612345678",
		cseOpinion1Type: null,
		cseOpinion1Opinion: null,
		cseOpinion1Date: null,
		cseOpinion2Type: null,
		cseOpinion2Opinion: null,
		cseOpinion2Date: null,
		cseOpinion3Type: null,
		cseOpinion3Opinion: null,
		cseOpinion3Date: null,
		cseOpinion4Type: null,
		cseOpinion4Opinion: null,
		cseOpinion4Date: null,
		...overrides,
	};
}

describe("generateCsv", () => {
	it("should generate header line from CSV_COLUMNS", () => {
		const csv = generateCsv([makeRow()]);
		const lines = csv.slice(1).split("\n");
		const expectedHeader = CSV_COLUMNS.map((c) => c.header).join(",");
		expect(lines[0]).toBe(expectedHeader);
	});

	it("should include UTF-8 BOM", () => {
		const csv = generateCsv([]);
		expect(csv.charCodeAt(0)).toBe(0xfeff);
	});

	it("should generate one data line per row", () => {
		const csv = generateCsv([makeRow(), makeRow({ siren: "987654321" })]);
		const lines = csv.trim().split("\n");
		// 1 header + 2 data lines
		expect(lines).toHaveLength(3);
	});

	it("should escape values containing commas", () => {
		const csv = generateCsv([
			makeRow({ address: "1 rue de Paris, 75001 Paris" }),
		]);
		expect(csv).toContain('"1 rue de Paris, 75001 Paris"');
	});

	it("should escape values containing double quotes", () => {
		const csv = generateCsv([makeRow({ companyName: 'Société "Test"' })]);
		expect(csv).toContain('"Société ""Test"""');
	});

	it("should output empty string for null values", () => {
		const csv = generateCsv([makeRow({ nafCode: null, workforce: null })]);
		const lines = csv.trim().split("\n");
		const dataLine = lines[1];
		// nafCode and workforce are columns 3 and 4 (0-indexed: 2 and 3)
		// The row should have consecutive commas for null values
		expect(dataLine).toContain(",,");
	});

	it("should map all ExportRow keys to CSV columns", () => {
		const row = makeRow();
		const csv = generateCsv([row]);
		const dataLine = csv.trim().split("\n")[1];
		const values = parseCsvLine(dataLine ?? "");
		expect(values).toHaveLength(CSV_COLUMNS.length);
	});

	it("should handle boolean values", () => {
		const csv = generateCsv([makeRow({ hasCse: true })]);
		expect(csv).toContain("true");
	});
});

/** Simple CSV line parser for testing (handles quoted values). */
function parseCsvLine(line: string): string[] {
	const values: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		if (inQuotes) {
			if (char === '"' && line[i + 1] === '"') {
				current += '"';
				i++;
			} else if (char === '"') {
				inQuotes = false;
			} else {
				current += char;
			}
		} else if (char === '"') {
			inQuotes = true;
		} else if (char === ",") {
			values.push(current);
			current = "";
		} else {
			current += char;
		}
	}
	values.push(current);
	return values;
}
