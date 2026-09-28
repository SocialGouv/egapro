import { join } from "node:path";
import { Image, Text, View } from "@react-pdf/renderer";

import { styles } from "../recapPdfStyles";

const DOCUMENT_ICON = join(
	process.cwd(),
	"public",
	"assets",
	"declaration-remuneration",
	"pdf",
	"document-icon.png",
);

export function EgaproBanner() {
	return (
		<View style={styles.banner}>
			<View>
				<Text style={styles.bannerTitle}>Egapro</Text>
				<Text style={styles.bannerSubtitle}>
					Indicateurs d&apos;égalité professionnelle femmes-hommes
				</Text>
			</View>
			<Image src={DOCUMENT_ICON} style={styles.bannerIcon} />
		</View>
	);
}
