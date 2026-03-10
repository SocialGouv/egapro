import { Text, View } from "@react-pdf/renderer";

import {
	formatCurrency,
	parseStep5Categories,
} from "~/modules/declaration-remuneration";

import { styles } from "../pdfStyles";
import type { DeclarationPdfData } from "../types";
import { GapCell } from "./GapCell";

export function CategorySection({ data }: { data: DeclarationPdfData }) {
	const parsed = parseStep5Categories(data.step5Categories);

	const findCatValue = (idx: number, suffix: string) =>
		data.step5Categories.find((c) => c.name === `cat:${idx}:${suffix}`);

	return (
		<View style={styles.card}>
			<Text style={styles.cardTitle}>
				Écart de rémunération par catégories de salariés
			</Text>
			{parsed.length > 0 ? (
				parsed.map((cat) => {
					const annualBase = findCatValue(cat.index, "annual:base");
					const annualVar = findCatValue(cat.index, "annual:variable");
					const hourlyBase = findCatValue(cat.index, "hourly:base");
					const hourlyVar = findCatValue(cat.index, "hourly:variable");
					const effectif = findCatValue(cat.index, "effectif");

					return (
						<View key={cat.index} style={styles.categoryBlock}>
							<Text style={styles.sectionLabel}>
								{cat.name}
								{effectif
									? ` (${effectif.womenCount ?? 0} F / ${effectif.menCount ?? 0} H)`
									: ""}
							</Text>
							<View style={styles.tableHeader}>
								<Text style={[styles.tableCellLabel, styles.tableHeaderText]}>
									Composante
								</Text>
								<Text style={[styles.tableCellValue, styles.tableHeaderText]}>
									Femmes
								</Text>
								<Text style={[styles.tableCellValue, styles.tableHeaderText]}>
									Hommes
								</Text>
								<Text style={[styles.tableCellGap, styles.tableHeaderText]}>
									Écart
								</Text>
							</View>
							<View style={styles.tableRow}>
								<Text style={styles.tableCellLabel}>
									Salaire de base (annuel)
								</Text>
								<Text style={styles.tableCellValue}>
									{formatCurrency(annualBase?.womenValue)}
								</Text>
								<Text style={styles.tableCellValue}>
									{formatCurrency(annualBase?.menValue)}
								</Text>
								<GapCell gap={cat.annualBaseGap} />
							</View>
							<View style={styles.tableRow}>
								<Text style={styles.tableCellLabel}>Variables (annuel)</Text>
								<Text style={styles.tableCellValue}>
									{formatCurrency(annualVar?.womenValue)}
								</Text>
								<Text style={styles.tableCellValue}>
									{formatCurrency(annualVar?.menValue)}
								</Text>
								<GapCell gap={cat.annualVariableGap} />
							</View>
							<View style={styles.tableRow}>
								<Text style={styles.tableCellLabel}>
									Salaire de base (horaire)
								</Text>
								<Text style={styles.tableCellValue}>
									{formatCurrency(hourlyBase?.womenValue)}
								</Text>
								<Text style={styles.tableCellValue}>
									{formatCurrency(hourlyBase?.menValue)}
								</Text>
								<GapCell gap={cat.hourlyBaseGap} />
							</View>
							<View style={styles.tableRow}>
								<Text style={styles.tableCellLabel}>Variables (horaire)</Text>
								<Text style={styles.tableCellValue}>
									{formatCurrency(hourlyVar?.womenValue)}
								</Text>
								<Text style={styles.tableCellValue}>
									{formatCurrency(hourlyVar?.menValue)}
								</Text>
								<GapCell gap={cat.hourlyVariableGap} />
							</View>
						</View>
					);
				})
			) : (
				<Text style={styles.noData}>Aucune donnée renseignée.</Text>
			)}
		</View>
	);
}
