// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

// ensurePdfFontsRegistered() is idempotent by design and @react-pdf's Font is a
// module singleton, so each case reloads both from a fresh module graph.
// This also keeps the registration — which points Marianne at public/dsfr/fonts,
// generated at dev/build time — away from the rendering tests.
async function loadFresh() {
	vi.resetModules();

	const [{ Font }, pdfFonts] = await Promise.all([
		import("@react-pdf/renderer"),
		import("../pdfFonts"),
	]);

	return { Font, ...pdfFonts };
}

describe("ensurePdfFontsRegistered", () => {
	it("registers the Marianne family", async () => {
		const { Font, ensurePdfFontsRegistered, PDF_FONT_FAMILY } =
			await loadFresh();

		ensurePdfFontsRegistered();

		expect(Font.getRegisteredFontFamilies()).toContain(PDF_FONT_FAMILY);
	});

	it("disables the bundled en-US hyphenation engine", async () => {
		const { Font, ensurePdfFontsRegistered, splitOnSoftHyphen } =
			await loadFresh();

		// Stands in for "production never called registerHyphenationCallback".
		// If the call is ever dropped, this sentinel survives — and left to its
		// bundled en-US patterns react-pdf cuts French copy mid-syllable
		// ("Pourcentage" → "Pourcent-age", issue 4126).
		const sentinel = (word: string) => [word];
		Font.registerHyphenationCallback(sentinel);

		ensurePdfFontsRegistered();

		expect(Font.getHyphenationCallback()).toBe(splitOnSoftHyphen);
	});
});
