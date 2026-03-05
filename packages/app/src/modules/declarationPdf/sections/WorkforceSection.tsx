import { Text, View } from "@react-pdf/renderer";

import { styles } from "../pdfStyles";
import type { DeclarationPdfData } from "../types";

export function WorkforceSection({ data }: { data: DeclarationPdfData }) {
	return (
		<View style={styles.card}>
			<Text style={styles.cardTitle}>
				Effectifs pris en compte pour le calcul
			</Text>
			<View style={styles.tableHeader}>
				<Text style={[styles.tableCellLabel, styles.tableHeaderText]}>
					Catégorie
				</Text>
				<Text style={[styles.tableCellValue, styles.tableHeaderText]}>
					Femmes
				</Text>
				<Text style={[styles.tableCellValue, styles.tableHeaderText]}>
					Hommes
				</Text>
				<Text style={[styles.tableCellValue, styles.tableHeaderText]}>
					Total
				</Text>
			</View>
			{data.step1Categories.map((cat) => (
				<View key={cat.name} style={styles.tableRow}>
					<Text style={styles.tableCellLabel}>{cat.name}</Text>
					<Text style={styles.tableCellValue}>{cat.women}</Text>
					<Text style={styles.tableCellValue}>{cat.men}</Text>
					<Text style={styles.tableCellValue}>{cat.women + cat.men}</Text>
				</View>
			))}
			<View style={styles.tableRowLast}>
				<Text style={styles.tableCellLabelBold}>Total</Text>
				<Text style={styles.tableCellValueBold}>{data.totalWomen}</Text>
				<Text style={styles.tableCellValueBold}>{data.totalMen}</Text>
				<Text style={styles.tableCellValueBold}>
					{data.totalWomen + data.totalMen}
				</Text>
			</View>
		</View>
	);
}
