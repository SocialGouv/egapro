import { Text, View } from "@react-pdf/renderer";

import {
	computePercentage,
	type StepCategoryData,
} from "~/modules/declaration-remuneration";

import { styles } from "../pdfStyles";
import type { DeclarationPdfData } from "../types";

function QuartileTable({
	quartiles,
	prefix,
	title,
}: {
	quartiles: StepCategoryData[];
	prefix: string;
	title: string;
}) {
	return (
		<View>
			<Text style={styles.sectionLabel}>{title}</Text>
			<View style={styles.tableHeader}>
				<Text style={[styles.tableCellLabel, styles.tableHeaderText]}>
					Quartile
				</Text>
				<Text style={[styles.tableCellValue, styles.tableHeaderText]}>
					Femmes
				</Text>
				<Text style={[styles.tableCellValue, styles.tableHeaderText]}>
					Hommes
				</Text>
				<Text style={[styles.tableCellValue, styles.tableHeaderText]}>
					% Femmes
				</Text>
				<Text style={[styles.tableCellValue, styles.tableHeaderText]}>
					% Hommes
				</Text>
			</View>
			{quartiles.map((q) => {
				const womenCount = q.womenCount ?? 0;
				const menCount = q.menCount ?? 0;
				const total = womenCount + menCount;
				return (
					<View key={q.name} style={styles.tableRow}>
						<Text style={styles.tableCellLabel}>
							{q.name.replace(`${prefix}:`, "")}
						</Text>
						<Text style={styles.tableCellValue}>{womenCount}</Text>
						<Text style={styles.tableCellValue}>{menCount}</Text>
						<Text style={styles.tableCellValue}>
							{computePercentage(womenCount, total)}
						</Text>
						<Text style={styles.tableCellValue}>
							{computePercentage(menCount, total)}
						</Text>
					</View>
				);
			})}
		</View>
	);
}

export function QuartileSection({ data }: { data: DeclarationPdfData }) {
	const annualQuartiles = data.step4Categories.filter((c) =>
		c.name.startsWith("annual:"),
	);
	const hourlyQuartiles = data.step4Categories.filter((c) =>
		c.name.startsWith("hourly:"),
	);

	return (
		<View style={styles.card}>
			<Text style={styles.cardTitle}>
				Proportion de femmes et d&apos;hommes dans chaque quartile salarial
			</Text>
			{annualQuartiles.length > 0 || hourlyQuartiles.length > 0 ? (
				<>
					{annualQuartiles.length > 0 && (
						<QuartileTable
							prefix="annual"
							quartiles={annualQuartiles}
							title="Rémunération annuelle brute moyenne"
						/>
					)}
					{hourlyQuartiles.length > 0 && (
						<QuartileTable
							prefix="hourly"
							quartiles={hourlyQuartiles}
							title="Rémunération horaire brute moyenne"
						/>
					)}
				</>
			) : (
				<Text style={styles.noData}>Aucune donnée renseignée.</Text>
			)}
		</View>
	);
}
