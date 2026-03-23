import { Text, View } from "@react-pdf/renderer";

import type { PayGapRow } from "~/modules/declaration-remuneration";
import { computeGap, formatCurrency } from "~/modules/domain";

import { styles } from "../pdfStyles";
import { GapCell } from "./GapCell";

const LABELS = [
	"Annuelle brute moyenne",
	"Annuelle brute médiane",
	"Horaire brute moyenne",
	"Horaire brute médiane",
];

function findRow(rows: PayGapRow[], label: string): PayGapRow | undefined {
	return rows.find((r) => r.label === label);
}

export function PayGapTable({
	rows,
	title,
}: {
	rows: PayGapRow[];
	title: string;
}) {
	return (
		<View style={styles.card}>
			<Text style={styles.cardTitle}>{title}</Text>
			{rows.length > 0 ? (
				<>
					<View style={styles.tableHeader}>
						<Text style={[styles.tableCellLabel, styles.tableHeaderText]}>
							Rémunération
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
					{LABELS.map((label) => {
						const row = findRow(rows, label);
						if (!row) return null;
						const gap = computeGap(row.womenValue, row.menValue);
						return (
							<View key={label} style={styles.tableRow}>
								<Text style={styles.tableCellLabel}>{label}</Text>
								<Text style={styles.tableCellValue}>
									{formatCurrency(row.womenValue)}
								</Text>
								<Text style={styles.tableCellValue}>
									{formatCurrency(row.menValue)}
								</Text>
								<GapCell gap={gap} />
							</View>
						);
					})}
				</>
			) : (
				<Text style={styles.noData}>Aucune donnée renseignée.</Text>
			)}
		</View>
	);
}
