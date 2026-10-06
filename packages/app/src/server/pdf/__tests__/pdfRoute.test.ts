import { describe, expect, it } from "vitest";
import { pdfHeaders } from "../pdfRoute";

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
