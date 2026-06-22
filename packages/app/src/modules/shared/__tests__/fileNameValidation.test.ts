import { describe, expect, it } from "vitest";

import {
	FILENAME_ERROR_MESSAGES,
	type FileNameError,
	fileNameSchema,
	MAX_FILENAME_LENGTH,
	validateFileName,
} from "../fileNameValidation";

const PDF_MIME = "application/pdf";

// All invisible/bidi fixtures are built from \uXXXX escapes so no raw
// bidirectional control byte ever lands in this source file — a raw byte
// would re-introduce the SonarCloud "bidirectional control characters"
// hotspot that the \p{Cf} hardening exists to remove.
const RLO = "\u202E"; // right-to-left override
const LRO = "\u202D"; // left-to-right override
const RLE = "\u202B"; // right-to-left embedding
const LRE = "\u202A"; // left-to-right embedding
const PDF_FMT = "\u202C"; // pop directional formatting
const LRI = "\u2066"; // left-to-right isolate
const RLI = "\u2067"; // right-to-left isolate
const FSI = "\u2068"; // first-strong isolate
const PDI = "\u2069"; // pop directional isolate
const LRM = "\u200E"; // left-to-right mark
const RLM = "\u200F"; // right-to-left mark
const ALM = "\u061C"; // Arabic letter mark
const WORD_JOINER = "\u2060";
const SOFT_HYPHEN = "\u00AD";
const ZWSP = "\u200B"; // zero-width space
const ZWNJ = "\u200C"; // zero-width non-joiner
const ZWJ = "\u200D"; // zero-width joiner
const BOM = "\uFEFF"; // byte-order mark / zero-width no-break space
const CONTROL_BYTE = "\u0000"; // NUL, representative C0 control

describe("validateFileName", () => {
	describe("valid file names", () => {
		it.each([
			["avis-cse.pdf"],
			["avis.pdf"],
			["été 2024.pdf"],
			["résumé.pdf"],
			["mon-fichier_v2.pdf"],
			["请注意.pdf"],
			["🎉.pdf"],
			// em-dash (U+2014) is a printable separator, not an invisible/forbidden char
			["Mon avis CSE — été 2024 🎉.pdf"],
			[`${"a".repeat(MAX_FILENAME_LENGTH - 4)}.pdf`],
		])("accepts %j with a matching MIME type", (fileName) => {
			expect(validateFileName(fileName, PDF_MIME)).toEqual({ ok: true });
		});

		it.each([
			["image.png", "image/png"],
			["photo.PNG", "image/png"],
			["scan.jpg", "image/jpeg"],
			["scan.jpeg", "image/jpeg"],
			["image.JPG", "image/jpeg"],
			["RAPPORT.PDF", "APPLICATION/PDF"],
		])("accepts %j against MIME %j (extension matched case-insensitively)", (fileName, mimeType) => {
			expect(validateFileName(fileName, mimeType)).toEqual({ ok: true });
		});

		it("accepts a name padded with surrounding spaces", () => {
			expect(validateFileName("  avis.pdf  ", PDF_MIME)).toEqual({ ok: true });
		});

		it("accepts a name whose length is exactly the maximum", () => {
			const fileName = `${"a".repeat(MAX_FILENAME_LENGTH - 4)}.pdf`;

			expect(fileName).toHaveLength(MAX_FILENAME_LENGTH);
			expect(validateFileName(fileName, PDF_MIME)).toEqual({ ok: true });
		});
	});

	describe("invalid file names", () => {
		it("rejects an empty name with reason empty", () => {
			const result = validateFileName("", PDF_MIME);

			expect(result.ok).toBe(false);
			expect(result).toMatchObject({
				ok: false,
				reason: "empty",
				message: FILENAME_ERROR_MESSAGES.empty,
			});
		});

		it("rejects a whitespace-only name with reason empty", () => {
			const result = validateFileName("   ", PDF_MIME);

			expect(result.ok).toBe(false);
			expect(result).toMatchObject({
				ok: false,
				reason: "empty",
				message: FILENAME_ERROR_MESSAGES.empty,
			});
		});

		it("rejects a name longer than the maximum with reason too_long", () => {
			const fileName = `${"a".repeat(MAX_FILENAME_LENGTH - 3)}.pdf`;
			const result = validateFileName(fileName, PDF_MIME);

			expect(fileName).toHaveLength(MAX_FILENAME_LENGTH + 1);
			expect(result.ok).toBe(false);
			expect(result).toMatchObject({
				ok: false,
				reason: "too_long",
				message: FILENAME_ERROR_MESSAGES.too_long,
			});
		});

		it.each([
			["<"],
			[">"],
			[":"],
			['"'],
			["|"],
			["?"],
			["*"],
			[";"],
			["/"],
			["\\"],
		])("rejects the forbidden character %j with reason forbidden_char", (char) => {
			const result = validateFileName(`avis${char}cse.pdf`, PDF_MIME);

			expect(result.ok).toBe(false);
			expect(result).toMatchObject({
				ok: false,
				reason: "forbidden_char",
				message: FILENAME_ERROR_MESSAGES.forbidden_char,
			});
		});

		it("rejects a null byte with reason forbidden_char", () => {
			const result = validateFileName(`avis${CONTROL_BYTE}cse.pdf`, PDF_MIME);

			expect(result.ok).toBe(false);
			expect(result).toMatchObject({
				ok: false,
				reason: "forbidden_char",
				message: FILENAME_ERROR_MESSAGES.forbidden_char,
			});
		});

		it("rejects a control character with reason forbidden_char", () => {
			const result = validateFileName("avis\u001Bcse.pdf", PDF_MIME);

			expect(result.ok).toBe(false);
			expect(result).toMatchObject({
				ok: false,
				reason: "forbidden_char",
				message: FILENAME_ERROR_MESSAGES.forbidden_char,
			});
		});

		it.each([
			["RLO (right-to-left override)", `avis${RLO}cse.pdf`],
			["LRO (left-to-right override)", `avis${LRO}cse.pdf`],
			["RLE (right-to-left embedding)", `avis${RLE}cse.pdf`],
			["LRE (left-to-right embedding)", `avis${LRE}cse.pdf`],
			["PDF (pop directional formatting)", `avis${PDF_FMT}cse.pdf`],
			["LRI (left-to-right isolate)", `avis${LRI}cse.pdf`],
			["RLI (right-to-left isolate)", `avis${RLI}cse.pdf`],
			["FSI then PDI (first-strong isolate)", `avis${FSI}cse${PDI}.pdf`],
			["LRM (left-to-right mark)", `avis${LRM}cse.pdf`],
			["RLM (right-to-left mark)", `avis${RLM}cse.pdf`],
			["ALM (Arabic letter mark)", `avis${ALM}cse.pdf`],
			["word joiner", `avis${WORD_JOINER}cse.pdf`],
			["soft hyphen hiding the real extension", `evil.exe${SOFT_HYPHEN}.pdf`],
			["zero-width space", `avis${ZWSP}cse.pdf`],
			["zero-width non-joiner", `avis${ZWNJ}cse.pdf`],
			["zero-width joiner", `avis${ZWJ}cse.pdf`],
			["BOM / zero-width no-break space", `avis${BOM}cse.pdf`],
		])("rejects a name with %s with reason invisible_char", (_label, fileName) => {
			const result = validateFileName(fileName, PDF_MIME);

			expect(result.ok).toBe(false);
			expect(result).toMatchObject({
				ok: false,
				reason: "invisible_char",
				message: FILENAME_ERROR_MESSAGES.invisible_char,
			});
		});

		// trim() strips a leading/trailing control or BOM before the extension is
		// read, so the forbidden/invisible checks must run on the original string.
		it.each<[string, string, FileNameError]>([
			["a BOM at the very start", `${BOM}avis.pdf`, "invisible_char"],
			["a BOM at the very end", `evil.pdf${BOM}`, "invisible_char"],
			[
				"a control char at the very end",
				`a.pdf${CONTROL_BYTE}`,
				"forbidden_char",
			],
		])("rejects %s with reason %s even though trim() would hide it", (_label, fileName, reason) => {
			const result = validateFileName(fileName, PDF_MIME);

			expect(result.ok).toBe(false);
			expect(result).toMatchObject({
				ok: false,
				reason,
				message: FILENAME_ERROR_MESSAGES[reason],
			});
		});

		it("rejects a name without an extension with reason extension_mime_mismatch", () => {
			const result = validateFileName("monfichier", PDF_MIME);

			expect(result.ok).toBe(false);
			expect(result).toMatchObject({
				ok: false,
				reason: "extension_mime_mismatch",
				message: FILENAME_ERROR_MESSAGES.extension_mime_mismatch,
			});
		});

		it("rejects a name ending with a dot with reason extension_mime_mismatch", () => {
			const result = validateFileName("monfichier.", PDF_MIME);

			expect(result.ok).toBe(false);
			expect(result).toMatchObject({
				ok: false,
				reason: "extension_mime_mismatch",
				message: FILENAME_ERROR_MESSAGES.extension_mime_mismatch,
			});
		});

		it("rejects an unknown extension with reason extension_mime_mismatch", () => {
			const result = validateFileName("notes.txt", "text/plain");

			expect(result.ok).toBe(false);
			expect(result).toMatchObject({
				ok: false,
				reason: "extension_mime_mismatch",
				message: FILENAME_ERROR_MESSAGES.extension_mime_mismatch,
			});
		});

		it("rejects an extension that does not match the declared MIME type", () => {
			const result = validateFileName("avis.pdf", "image/png");

			expect(result.ok).toBe(false);
			expect(result).toMatchObject({
				ok: false,
				reason: "extension_mime_mismatch",
				message: FILENAME_ERROR_MESSAGES.extension_mime_mismatch,
			});
		});
	});
});

describe("fileNameSchema", () => {
	it("accepts a valid file name and MIME type pair", () => {
		const result = fileNameSchema.safeParse({
			fileName: "avis.pdf",
			mimeType: PDF_MIME,
		});

		expect(result.success).toBe(true);
	});

	it("rejects a file name containing a forbidden character", () => {
		const result = fileNameSchema.safeParse({
			fileName: "avis<cse>.pdf",
			mimeType: PDF_MIME,
		});

		expect(result.success).toBe(false);
		if (result.success) {
			throw new Error("expected the schema to reject the file name");
		}

		const issue = result.error.issues[0];
		expect(issue?.path).toEqual(["fileName"]);
		expect(issue?.message).toBe(FILENAME_ERROR_MESSAGES.forbidden_char);

		const params = (issue as unknown as { params?: { reason?: string } })
			.params;
		expect(params?.reason).toBe("forbidden_char");
	});

	it("rejects a file name containing an invisible bidi control", () => {
		const result = fileNameSchema.safeParse({
			fileName: `avis${RLO}cse.pdf`,
			mimeType: PDF_MIME,
		});

		expect(result.success).toBe(false);
		if (result.success) {
			throw new Error("expected the schema to reject the file name");
		}

		const issue = result.error.issues[0];
		expect(issue?.path).toEqual(["fileName"]);
		expect(issue?.message).toBe(FILENAME_ERROR_MESSAGES.invisible_char);

		const params = (issue as unknown as { params?: { reason?: string } })
			.params;
		expect(params?.reason).toBe("invisible_char");
	});
});
