import { Text, View } from "@react-pdf/renderer";

import { styles } from "../recapPdfStyles";
import { normalizeSpaces } from "./tableParts";

type InfoRow = {
	label: string;
	value: string;
};

export function InfoSection({
	title,
	rows,
}: {
	title: string;
	rows: InfoRow[];
}) {
	return (
		<View wrap={false}>
			<View style={styles.sectionBanner}>
				<Text style={styles.sectionBannerText}>{title}</Text>
			</View>
			<View style={styles.infoBody}>
				<View style={styles.infoLabelColumn}>
					{rows.map((row) => (
						<Text key={row.label} style={styles.infoLabel}>
							{row.label}
						</Text>
					))}
				</View>
				<View style={styles.infoValueColumn}>
					{rows.map((row) => (
						<Text key={row.label} style={styles.infoValue}>
							{normalizeSpaces(row.value)}
						</Text>
					))}
				</View>
			</View>
		</View>
	);
}
