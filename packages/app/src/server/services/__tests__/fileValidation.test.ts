import { describe, expect, it } from "vitest";
import { validateFileSignature } from "../fileValidation";

const PDF_TYPES = ["application/pdf"] as const;
const IMAGE_TYPES = ["image/png", "image/jpeg"] as const;
const ALL_TYPES = ["application/pdf", "image/png", "image/jpeg"] as const;

describe("validateFileSignature", () => {
	it("returns valid for a proper PDF buffer", () => {
		const buffer = Buffer.from("%PDF-1.4 some content here");
		const result = validateFileSignature(buffer, PDF_TYPES);
		expect(result.valid).toBe(true);
		if (result.valid) {
			expect(result.detectedType).toBe("application/pdf");
		}
	});

	it("returns valid for a PNG buffer", () => {
		const buffer = Buffer.from([
			0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00,
		]);
		const result = validateFileSignature(buffer, IMAGE_TYPES);
		expect(result.valid).toBe(true);
		if (result.valid) {
			expect(result.detectedType).toBe("image/png");
		}
	});

	it("returns valid for a JPEG buffer", () => {
		const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
		const result = validateFileSignature(buffer, IMAGE_TYPES);
		expect(result.valid).toBe(true);
		if (result.valid) {
			expect(result.detectedType).toBe("image/jpeg");
		}
	});

	it("returns invalid for an empty buffer", () => {
		const buffer = Buffer.alloc(0);
		const result = validateFileSignature(buffer, ALL_TYPES);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error).toBe("Le fichier est vide.");
		}
	});

	it("returns invalid when file type is not in allowed list", () => {
		// PNG magic bytes, but only PDF allowed
		const buffer = Buffer.from([
			0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
		]);
		const result = validateFileSignature(buffer, PDF_TYPES);
		expect(result.valid).toBe(false);
		if (!result.valid) {
			expect(result.error).toContain("Format de fichier non supporté");
		}
	});

	it("returns invalid for a ZIP file when only PDF is allowed", () => {
		const buffer = Buffer.from("PK\x03\x04 not a pdf");
		const result = validateFileSignature(buffer, PDF_TYPES);
		expect(result.valid).toBe(false);
	});

	it("returns invalid for an HTML file", () => {
		const buffer = Buffer.from("<html>not a valid file</html>");
		const result = validateFileSignature(buffer, ALL_TYPES);
		expect(result.valid).toBe(false);
	});

	it("matches PDF when all types are allowed", () => {
		const buffer = Buffer.from("%PDF-1.7 content");
		const result = validateFileSignature(buffer, ALL_TYPES);
		expect(result.valid).toBe(true);
		if (result.valid) {
			expect(result.detectedType).toBe("application/pdf");
		}
	});

	it("returns invalid when header is too short for signature", () => {
		// Only 2 bytes, not enough for any signature
		const buffer = Buffer.from([0xff, 0xd8]);
		const result = validateFileSignature(buffer, IMAGE_TYPES);
		expect(result.valid).toBe(false);
	});
});
