import { Text, View } from "@react-pdf/renderer";

import { formatSiren } from "~/modules/domain";

import { styles } from "../recapPdfStyles";

type Props = {
	year: number;
	siren: string;
	transmittedAt: string;
};

export function PdfPageFooter({ year, siren, transmittedAt }: Props) {
	return (
		<View fixed style={styles.footer}>
			<Text style={styles.footerText}>
				Déclaration {year} - SIREN {formatSiren(siren)} - transmise le{" "}
				{transmittedAt}
			</Text>
			<Text
				render={({ pageNumber, totalPages }) =>
					`Page ${pageNumber}/${totalPages}`
				}
				style={styles.footerText}
			/>
		</View>
	);
}
