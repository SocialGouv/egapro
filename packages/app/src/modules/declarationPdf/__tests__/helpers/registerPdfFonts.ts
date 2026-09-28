import { createRequire } from "node:module";

import { Font } from "@react-pdf/renderer";

import { PDF_FONT_FAMILY, splitOnSoftHyphen } from "../../pdfFonts";

const resolve = createRequire(import.meta.url).resolve;

// Resolves Marianne from node_modules rather than through
// ensurePdfFontsRegistered(), which reads public/dsfr/fonts — generated at
// dev/build time and git-ignored. Real glyph metrics matter: a stand-in font
// shifts every measured height and line break.
export function registerPdfFonts({ hyphenation = false } = {}): void {
	Font.register({
		family: PDF_FONT_FAMILY,
		fonts: [
			{
				src: resolve("@gouvfr/dsfr/dist/fonts/Marianne-Regular.woff"),
				fontWeight: 400,
			},
			{
				src: resolve("@gouvfr/dsfr/dist/fonts/Marianne-Bold.woff"),
				fontWeight: 700,
			},
		],
	});

	// Opt-in: the hyphenation specs need the production callback, since a local
	// stand-in would let them pass while the real PDF still hyphenates.
	if (hyphenation) Font.registerHyphenationCallback(splitOnSoftHyphen);
}
