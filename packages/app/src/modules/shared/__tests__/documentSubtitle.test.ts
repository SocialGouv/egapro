import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { formatDocumentSubtitle } from "../documentSubtitle";

describe("formatDocumentSubtitle", () => {
	it("names the campaign year and the year of the underlying data", () => {
		expect(formatDocumentSubtitle(2025, 2024)).toBe(
			"Année 2025 au titre des données 2024",
		);
	});

	// Server Components call this helper. Every export of a "use client" module
	// is a client reference, so hosting it in one would crash them at render —
	// a failure neither tsc nor jsdom can see.
	it("lives in a module a Server Component can call", () => {
		const source = readFileSync(
			join(__dirname, "..", "documentSubtitle.ts"),
			"utf8",
		);

		expect(source).not.toMatch(/^\s*["']use client["']/);
	});
});
