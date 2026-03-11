import { Text, View } from "@react-pdf/renderer";

import {
	formatCurrency,
	parseEmployeeCategories,
} from "~/modules/declaration-remuneration";

import { styles } from "../pdfStyles";
import type { DeclarationPdfData } from "../types";
import { GapCell } from "./GapCell";

export function CategorySection({ data }: { data: DeclarationPdfData }) {
	const parsed = parseEmployeeCategories(data.step5Categories);

	return (
		<View style={styles.card}>
			<Text style={styles.cardTitle}>
				Écart de rémunération par catégories de salariés
			</Text>
			{parsed.length > 0 ? (
				parsed.map((cat) => {
					const row = data.step5Categories[cat.index];

					return (
						<View key={cat.index} style={styles.categoryBlock}>
							<Text style={styles.sectionLabel}>
								{cat.name}
								{row
									? ` (${row.womenCount ?? 0} F / ${row.menCount ?? 0} H)`
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
									{formatCurrency(row?.annualBaseWomen)}
								</Text>
								<Text style={styles.tableCellValue}>
									{formatCurrency(row?.annualBaseMen)}
								</Text>
								<GapCell gap={cat.annualBaseGap} />
							</View>
							<View style={styles.tableRow}>
								<Text style={styles.tableCellLabel}>Variables (annuel)</Text>
								<Text style={styles.tableCellValue}>
									{formatCurrency(row?.annualVariableWomen)}
								</Text>
								<Text style={styles.tableCellValue}>
									{formatCurrency(row?.annualVariableMen)}
								</Text>
								<GapCell gap={cat.annualVariableGap} />
							</View>
							<View style={styles.tableRow}>
								<Text style={styles.tableCellLabel}>
									Salaire de base (horaire)
								</Text>
								<Text style={styles.tableCellValue}>
									{formatCurrency(row?.hourlyBaseWomen)}
								</Text>
								<Text style={styles.tableCellValue}>
									{formatCurrency(row?.hourlyBaseMen)}
								</Text>
								<GapCell gap={cat.hourlyBaseGap} />
							</View>
							<View style={styles.tableRow}>
								<Text style={styles.tableCellLabel}>Variables (horaire)</Text>
								<Text style={styles.tableCellValue}>
									{formatCurrency(row?.hourlyVariableWomen)}
								</Text>
								<Text style={styles.tableCellValue}>
									{formatCurrency(row?.hourlyVariableMen)}
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
