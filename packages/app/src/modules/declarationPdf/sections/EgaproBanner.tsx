import { join } from "node:path";
import { Image, Text, View } from "@react-pdf/renderer";

import { type PdfStyles, styles } from "../recapPdfStyles";

const PICTOGRAM_FILES = {
	documentSignature: "document-icon.png",
	document: "document-pictogram.png",
} as const;

export type EgaproBannerPictogram = keyof typeof PICTOGRAM_FILES;

function pictogramPath(pictogram: EgaproBannerPictogram): string {
	return join(
		process.cwd(),
		"public",
		"assets",
		"declaration-remuneration",
		"pdf",
		PICTOGRAM_FILES[pictogram],
	);
}

export function EgaproBanner({
	pictogram = "documentSignature",
	sheet = styles,
}: {
	pictogram?: EgaproBannerPictogram;
	sheet?: PdfStyles;
}) {
	return (
		<View style={sheet.banner}>
			<View>
				<Text style={sheet.bannerTitle}>Egapro</Text>
				<Text style={sheet.bannerSubtitle}>
					Indicateurs d&apos;égalité professionnelle femmes-hommes
				</Text>
			</View>
			<Image src={pictogramPath(pictogram)} style={sheet.bannerIcon} />
		</View>
	);
}
