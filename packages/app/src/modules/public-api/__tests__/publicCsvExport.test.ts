import { describe, expect, it } from "vitest";
import type { CsvColumn } from "~/modules/public-api";
import { toPublicCsv } from "~/modules/public-api";

type Row = {
	name: string | null | undefined;
	ratio: number | null | undefined;
	workforce: number | null | undefined;
};

const columns: CsvColumn<Row>[] = [
	{ key: "name", header: "Raison_sociale" },
	{ key: "workforce", header: "Effectif_annuel_moyen" },
	{ key: "ratio", header: "Ecart", percent: true },
];

describe("toPublicCsv", () => {
	it("quotes the header and every field, separated by semicolons", () => {
		const csv = toPublicCsv(columns, [
			{ name: "Société Démo", workforce: 42, ratio: 0.074 },
		]);

		expect(csv.split("\n")[0]).toBe(
			'"Raison_sociale";"Effectif_annuel_moyen";"Ecart"',
		);
		expect(csv.split("\n")[1]).toBe('"Société Démo";"42";"7.4"');
	});

	it("doubles inner quotes and keeps a semicolon inside its field", () => {
		const csv = toPublicCsv(columns, [
			{ name: 'Gamma "X"; SARL', workforce: null, ratio: null },
		]);

		expect(csv.split("\n")[1]?.startsWith('"Gamma ""X""; SARL"')).toBe(true);
	});

	it.each([
		"=SUM(A1)",
		"+1",
		"-1",
		"@cmd",
		"|pipe",
		"\ttab",
		"\rline",
	])("prefixes the formula trigger %j with an apostrophe", (name) => {
		const csv = toPublicCsv(columns, [{ name, workforce: null, ratio: null }]);

		expect(csv.split("\n")[1]?.startsWith(`"'${name}`)).toBe(true);
	});

	it("never prefixes a negative number", () => {
		const csv = toPublicCsv(columns, [
			{ name: null, workforce: -12, ratio: -0.05 },
		]);

		expect(csv.split("\n")[1]).toBe('"";"-12";"-5"');
	});

	it("emits an empty quoted field for null or undefined values", () => {
		const csv = toPublicCsv<Row>(columns, [
			{ name: null, workforce: undefined, ratio: null },
		]);

		expect(csv.split("\n")[1]).toBe('"";"";""');
	});

	it("renders a percent column in percentage points truncated to two decimals", () => {
		const csv = toPublicCsv(columns, [
			{ name: null, workforce: null, ratio: 0.123456 },
		]);

		expect(csv.split("\n")[1]?.split(";")[2]).toBe('"12.34"');
	});

	it("returns only the header when there is no row", () => {
		expect(toPublicCsv(columns, [])).toBe(
			'"Raison_sociale";"Effectif_annuel_moyen";"Ecart"',
		);
	});

	it("emits one line per row in the given order", () => {
		const csv = toPublicCsv(columns, [
			{ name: "Alpha", workforce: 1, ratio: null },
			{ name: "Bêta", workforce: 2, ratio: null },
		]);

		expect(csv.split("\n")).toHaveLength(3);
		expect(csv.split("\n")[1]?.startsWith('"Alpha"')).toBe(true);
		expect(csv.split("\n")[2]?.startsWith('"Bêta"')).toBe(true);
	});
});
