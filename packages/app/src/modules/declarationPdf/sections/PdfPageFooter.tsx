import { Text, View } from "@react-pdf/renderer";

import { styles } from "../recapPdfStyles";

export function PdfPageFooter({ label }: { label: string }) {
	return (
		<View fixed style={styles.footer}>
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
