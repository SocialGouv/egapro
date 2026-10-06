import { describe, expect, it } from "vitest";
import { pdfHeaders, readRequestedYear } from "../pdfRoute";

describe("pdfHeaders", () => {
	it("describes the PDF attachment", () => {
		expect(pdfHeaders("declaration.pdf", 1234)).toMatchObject({
			"Content-Type": "application/pdf",
			"Content-Disposition": 'attachment; filename="declaration.pdf"',
			"Content-Length": "1234",
		});
	});

	it("keeps the company's PDF out of every cache", () => {
		expect(pdfHeaders("declaration.pdf", 1234)["Cache-Control"]).toBe(
			"private, no-store",
		);
	});
});

describe("readRequestedYear", () => {
	function requestWith(query: string): Request {
		return new Request(`https://egapro.test/api/declaration-pdf${query}`);
	}

	it("reads a valid campaign year as a number", () => {
		expect(readRequestedYear(requestWith("?year=2027"))).toEqual({
			year: 2027,
			invalid: false,
		});
	});

	it("reports no year when none is requested", () => {
		expect(readRequestedYear(requestWith(""))).toEqual({
			year: null,
			invalid: false,
		});
	});

	it.each([
		["out of range", "1900"],
		["not a number", "abc"],
		["a number with a trailing suffix", "2027abc"],
		["oversized", "9".repeat(5_000)],
	])("flags a year that is %s, without carrying the raw string", (_label, raw) => {
		expect(readRequestedYear(requestWith(`?year=${raw}`))).toEqual({
			year: null,
			invalid: true,
		});
	});
});
