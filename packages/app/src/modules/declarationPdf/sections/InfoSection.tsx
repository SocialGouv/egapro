import { Text, View } from "@react-pdf/renderer";

import { type PdfStyles, styles } from "../recapPdfStyles";
import { normalizeSpaces } from "./tableParts";

type InfoRow = {
	label: string;
	value: string;
};

export function InfoSection({
	title,
	rows,
	sheet = styles,
}: {
	title: string;
	rows: InfoRow[];
	sheet?: PdfStyles;
}) {
	return (
		<View wrap={false}>
			<View style={sheet.sectionBanner}>
				<Text style={sheet.sectionBannerText}>{title}</Text>
			</View>
			<View style={sheet.infoBody}>
				<View style={sheet.infoLabelColumn}>
					{rows.map((row) => (
						<Text key={row.label} style={sheet.infoLabel}>
							{row.label}
						</Text>
					))}
				</View>
				<View style={sheet.infoValueColumn}>
					{rows.map((row) => (
						<Text key={row.label} style={sheet.infoValue}>
							{normalizeSpaces(row.value)}
						</Text>
					))}
				</View>
			</View>
		</View>
	);
}
