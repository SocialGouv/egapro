import { join } from "node:path";
import { Font } from "@react-pdf/renderer";

export const PDF_FONT_FAMILY = "Marianne";

const SOFT_HYPHEN = "­";

// Left to itself, @react-pdf/renderer hyphenates with its bundled `hyphen`
// engine, which only ships en-US patterns. Applied to French copy they cut
// words mid-syllable: "rémunération" renders as "ré-munéra-tion" and
// "Pourcentage" as "Pour-cent-age" in the table headers (issue 4126).
// Splitting on the soft hyphen instead keeps every word whole, while leaving
// authors an explicit opt-in break point.
export function splitOnSoftHyphen(word: string): string[] {
	return word.split(SOFT_HYPHEN);
}

let arePdfFontsRegistered = false;

export function ensurePdfFontsRegistered() {
	if (arePdfFontsRegistered) {
		return;
	}

	const fontsDirectory = join(process.cwd(), "public", "dsfr", "fonts");

	Font.register({
		family: PDF_FONT_FAMILY,
		fonts: [
			{ src: join(fontsDirectory, "Marianne-Regular.woff"), fontWeight: 400 },
			{ src: join(fontsDirectory, "Marianne-Bold.woff"), fontWeight: 700 },
			{
				src: join(fontsDirectory, "Marianne-Regular_Italic.woff"),
				fontStyle: "italic",
				fontWeight: 400,
			},
		],
	});

	Font.registerHyphenationCallback(splitOnSoftHyphen);

	arePdfFontsRegistered = true;
}
