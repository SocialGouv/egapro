import { Font } from "@react-pdf/renderer";
import { join } from "node:path";

export const PDF_FONT_FAMILY = "Marianne";

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

	arePdfFontsRegistered = true;
}
