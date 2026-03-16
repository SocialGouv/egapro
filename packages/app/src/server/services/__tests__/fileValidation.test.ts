import { describe, expect, it } from "vitest";
import { validatePdf } from "../fileValidation";

describe("validatePdf", () => {
	it("returns valid for a proper PDF buffer", () => {
		const buffer = Buffer.from("%PDF-1.4 some content here");
		const result = validatePdf(buffer);
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("returns invalid for an empty buffer", () => {
		const buffer = Buffer.alloc(0);
		const result = validatePdf(buffer);
		expect(result.valid).toBe(false);
		expect(result.error).toBe("Le fichier est vide.");
	});

	it("returns invalid for a buffer exceeding 10 MB", () => {
		const buffer = Buffer.alloc(10 * 1024 * 1024 + 1);
		// Set PDF magic bytes so it doesn't fail on that check first
		buffer.write("%PDF-");
		const result = validatePdf(buffer);
		expect(result.valid).toBe(false);
		expect(result.error).toContain("10 Mo");
	});

	it("returns invalid for a non-PDF file", () => {
		const buffer = Buffer.from("PK\x03\x04 not a pdf");
		const result = validatePdf(buffer);
		expect(result.valid).toBe(false);
		expect(result.error).toBe("Le fichier n'est pas un PDF valide.");
	});

	it("returns invalid for a buffer with wrong magic bytes", () => {
		const buffer = Buffer.from("<html>not a pdf</html>");
		const result = validatePdf(buffer);
		expect(result.valid).toBe(false);
		expect(result.error).toBe("Le fichier n'est pas un PDF valide.");
	});

	it("returns valid for exactly 10 MB PDF", () => {
		const buffer = Buffer.alloc(10 * 1024 * 1024);
		buffer.write("%PDF-");
		const result = validatePdf(buffer);
		expect(result.valid).toBe(true);
	});
});
