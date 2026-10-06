import { describe, expect, it } from "vitest";

import { toCsvField } from "../csv";

describe("toCsvField", () => {
	it("wraps a plain value in double quotes", () => {
		expect(toCsvField("Société Démo")).toBe('"Société Démo"');
	});

	it("renders null and undefined as an empty quoted field", () => {
		expect(toCsvField(null)).toBe('""');
		expect(toCsvField(undefined)).toBe('""');
	});

	it("stringifies numbers and booleans", () => {
		expect(toCsvField(42.5)).toBe('"42.5"');
		expect(toCsvField(false)).toBe('"false"');
	});

	it("doubles embedded double quotes", () => {
		expect(toCsvField('a "quoted" word')).toBe('"a ""quoted"" word"');
	});

	it("keeps the semicolon separator inside the quoted field", () => {
		expect(toCsvField("Paris; Lyon")).toBe('"Paris; Lyon"');
	});

	it("keeps line breaks inside the quoted field", () => {
		expect(toCsvField("ligne 1\nligne 2\r\nligne 3")).toBe(
			'"ligne 1\nligne 2\r\nligne 3"',
		);
	});

	it.each([
		["=", "=1+1", `"'=1+1"`],
		["+", "+33612345678", `"'+33612345678"`],
		["-", "-2+3", `"'-2+3"`],
		["@", "@SUM(A1:A2)", `"'@SUM(A1:A2)"`],
		["|", "|cmd", `"'|cmd"`],
	])("neutralises a value starting with %s", (_prefix, value, expected) => {
		expect(toCsvField(value)).toBe(expected);
	});

	it("neutralises a formula whose quotes are escaped", () => {
		expect(toCsvField('=HYPERLINK("http://example.fr")')).toBe(
			`"'=HYPERLINK(""http://example.fr"")"`,
		);
	});

	it("leaves a dangerous character that is not leading untouched", () => {
		expect(toCsvField("1+1=2")).toBe('"1+1=2"');
		expect(toCsvField("email@example.fr")).toBe('"email@example.fr"');
	});
});
