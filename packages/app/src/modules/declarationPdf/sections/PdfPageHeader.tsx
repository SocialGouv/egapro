import { join } from "node:path";
import { Image, Text, View } from "@react-pdf/renderer";

import { type PdfStyles, styles } from "../recapPdfStyles";
import { pdfStructure } from "../tagging/pdfStructure";

const MINISTERE_LOGO = join(
	process.cwd(),
	"public",
	"assets",
	"declaration-remuneration",
	"pdf",
	"ministere-travail.png",
);

const MINISTERE_LOGO_ALT =
	"Ministère du Travail et des Solidarités. Liberté, Égalité, Fraternité";

export function PdfPageHeader({ sheet = styles }: { sheet?: PdfStyles }) {
	return (
		<View fixed style={sheet.header}>
			<Image
				{...pdfStructure({ tag: "Figure", alt: MINISTERE_LOGO_ALT })}
				src={MINISTERE_LOGO}
				style={sheet.headerLogo}
			/>
			<Text style={sheet.headerText}>Direction Générale{"\n"}du Travail</Text>
		</View>
	);
}
