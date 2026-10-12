import { join } from "node:path";
import { Image, Text, View } from "@react-pdf/renderer";

import { type PdfStyles, styles } from "../recapPdfStyles";

const MINISTERE_LOGO = join(
	process.cwd(),
	"public",
	"assets",
	"declaration-remuneration",
	"pdf",
	"ministere-travail.png",
);

export function PdfPageHeader({ sheet = styles }: { sheet?: PdfStyles }) {
	return (
		<View fixed style={sheet.header}>
			<Image src={MINISTERE_LOGO} style={sheet.headerLogo} />
			<Text style={sheet.headerText}>Direction Générale{"\n"}du Travail</Text>
		</View>
	);
}
