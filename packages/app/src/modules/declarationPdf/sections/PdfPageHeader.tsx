import { join } from "node:path";
import { Image, Text, View } from "@react-pdf/renderer";

import { usePdfStyles } from "./pdfStylesContext";

const MINISTERE_LOGO = join(
	process.cwd(),
	"public",
	"assets",
	"declaration-remuneration",
	"pdf",
	"ministere-travail.png",
);

export function PdfPageHeader() {
	const styles = usePdfStyles();
	return (
		<View fixed style={styles.header}>
			<Image src={MINISTERE_LOGO} style={styles.headerLogo} />
			<Text style={styles.headerText}>Direction Générale{"\n"}du Travail</Text>
		</View>
	);
}
