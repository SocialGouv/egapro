import { Text, View } from "@react-pdf/renderer";

import { styles } from "../recapPdfStyles";
import { pdfTag } from "../tagging/pdfStructure";

export function PdfPageFooter({ label }: { label: string }) {
	return (
		<View {...pdfTag("Artifact")} fixed style={styles.footer}>
			<Text style={styles.footerText}>{label}</Text>
			<Text
				render={({ pageNumber, totalPages }) =>
					`Page ${pageNumber}/${totalPages}`
				}
				style={styles.footerText}
			/>
		</View>
	);
}
