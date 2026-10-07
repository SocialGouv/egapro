import { describe, expect, it } from "vitest";
import {
	invalidYearResponse,
	parseRequestedYear,
	pdfErrorResponse,
	pdfHeaders,
} from "../pdfRoute";

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

describe("parseRequestedYear", () => {
	function requestWith(query: string): Request {
		return new Request(`https://egapro.test/api/declaration-pdf${query}`);
	}

	it("reads a valid campaign year as a number", () => {
		expect(parseRequestedYear(requestWith("?year=2027"))).toEqual({
			success: true,
			data: { year: 2027 },
		});
	});

	it("reports no year when none is requested", () => {
		expect(parseRequestedYear(requestWith(""))).toEqual({
			success: true,
			data: { year: null },
		});
	});

	it.each([
		["out of range", "1900"],
		["not a number", "abc"],
		["a number with a trailing suffix", "2027abc"],
		["oversized", "9".repeat(5_000)],
	])("flags a year that is %s by name, without carrying the raw string", (_label, raw) => {
		expect(parseRequestedYear(requestWith(`?year=${raw}`))).toEqual({
			success: false,
			error: { issues: [{ path: ["year"] }] },
		});
	});
});

describe("pdfErrorResponse", () => {
	it("answers the status with a body kept out of every cache", async () => {
		const response = pdfErrorResponse("Non autorisé", 401);

		expect(response.status).toBe(401);
		expect(await response.text()).toBe("Non autorisé");
		expect(response.headers.get("Cache-Control")).toBe("private, no-store");
	});

	it("answers a body-less error for HEAD probes", async () => {
		const response = pdfErrorResponse(null, 404);

		expect(response.status).toBe(404);
		expect(await response.text()).toBe("");
		expect(response.headers.get("Cache-Control")).toBe("private, no-store");
	});
});

describe("invalidYearResponse", () => {
	it("is a non-cacheable 400", () => {
		const response = invalidYearResponse();

		expect(response.status).toBe(400);
		expect(response.headers.get("Cache-Control")).toBe("private, no-store");
	});
});
