import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import {
	computeGap,
	computePercentage,
	formatCurrency,
	formatGap,
	gapLevel,
} from "~/modules/declaration-remuneration/shared/gapUtils";
import { parseStep5Categories } from "~/modules/declaration-remuneration/steps/step6/parseStep5Categories";
import type { PayGapRow } from "~/modules/declaration-remuneration/types";
import type { DeclarationPdfData } from "./types";

const BLUE_FRANCE = "#000091";
const GREY_BG = "#F6F6F6";
const GREY_BORDER = "#E5E5E5";
const GREY_TEXT = "#666666";
const WARNING_BG = "#FFE9E6";
const WARNING_TEXT = "#CE0500";
const INFO_BG = "#E3E3FD";
const TABLE_HEADER_BG = "#E3E3FD";

const styles = StyleSheet.create({
	page: {
		padding: 40,
		fontFamily: "Helvetica",
		fontSize: 10,
		color: "#161616",
	},
	header: {
		marginBottom: 20,
	},
	title: {
		fontSize: 16,
		fontFamily: "Helvetica-Bold",
		color: BLUE_FRANCE,
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 11,
		color: GREY_TEXT,
		marginBottom: 8,
	},
	companyInfo: {
		fontSize: 10,
		marginBottom: 2,
	},
	card: {
		backgroundColor: GREY_BG,
		border: `1 solid ${GREY_BORDER}`,
		borderRadius: 4,
		padding: 12,
		marginBottom: 10,
	},
	cardTitle: {
		fontSize: 11,
		fontFamily: "Helvetica-Bold",
		marginBottom: 8,
	},
	tableRow: {
		flexDirection: "row",
		borderBottom: `1 solid ${GREY_BORDER}`,
		paddingVertical: 3,
		alignItems: "center",
	},
	tableHeader: {
		flexDirection: "row",
		backgroundColor: TABLE_HEADER_BG,
		paddingVertical: 4,
		paddingHorizontal: 2,
		borderRadius: 2,
		marginBottom: 2,
	},
	tableHeaderText: {
		fontSize: 8,
		fontFamily: "Helvetica-Bold",
		color: BLUE_FRANCE,
	},
	tableCellLabel: {
		flex: 3,
		fontSize: 9,
	},
	tableCellValue: {
		flex: 2,
		fontSize: 9,
		textAlign: "right",
	},
	tableCellGap: {
		flex: 2,
		fontSize: 9,
		textAlign: "right",
		fontFamily: "Helvetica-Bold",
	},
	badgeRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "flex-end",
	},
	badge: {
		fontSize: 7,
		paddingHorizontal: 3,
		paddingVertical: 1,
		borderRadius: 2,
		marginLeft: 3,
	},
	badgeLow: {
		backgroundColor: INFO_BG,
		color: BLUE_FRANCE,
	},
	badgeHigh: {
		backgroundColor: WARNING_BG,
		color: WARNING_TEXT,
	},
	sectionLabel: {
		fontSize: 9,
		fontFamily: "Helvetica-Bold",
		marginBottom: 4,
		marginTop: 6,
	},
	noData: {
		fontSize: 9,
		color: GREY_TEXT,
		fontStyle: "italic",
	},
	proportionRow: {
		flexDirection: "row",
		gap: 16,
		marginTop: 6,
	},
	proportionItem: {
		flex: 1,
	},
	proportionLabel: {
		fontSize: 8,
		color: GREY_TEXT,
		marginBottom: 2,
	},
	proportionValue: {
		fontSize: 10,
		fontFamily: "Helvetica-Bold",
	},
	categoryBlock: {
		marginBottom: 6,
	},
	footer: {
		position: "absolute",
		bottom: 30,
		left: 40,
		right: 40,
		fontSize: 8,
		color: GREY_TEXT,
		textAlign: "center",
	},
});

function findRow(rows: PayGapRow[], label: string): PayGapRow | undefined {
	return rows.find((r) => r.label === label);
}

function GapCell({ gap }: { gap: number | null }) {
	const level = gapLevel(gap);
	return (
		<View style={[styles.tableCellGap, styles.badgeRow]}>
			<Text>{formatGap(gap)}</Text>
			{level && (
				<Text
					style={[
						styles.badge,
						level === "low" ? styles.badgeLow : styles.badgeHigh,
					]}
				>
					{level === "low" ? "faible" : "élevé"}
				</Text>
			)}
		</View>
	);
}

function WorkforceSection({ data }: { data: DeclarationPdfData }) {
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
			<View style={[styles.tableRow, { borderBottom: "none" }]}>
				<Text style={[styles.tableCellLabel, { fontFamily: "Helvetica-Bold" }]}>
					Total
				</Text>
				<Text style={[styles.tableCellValue, { fontFamily: "Helvetica-Bold" }]}>
					{data.totalWomen}
				</Text>
				<Text style={[styles.tableCellValue, { fontFamily: "Helvetica-Bold" }]}>
					{data.totalMen}
				</Text>
				<Text style={[styles.tableCellValue, { fontFamily: "Helvetica-Bold" }]}>
					{data.totalWomen + data.totalMen}
				</Text>
			</View>
		</View>
	);
}

function PayGapTable({ rows, title }: { rows: PayGapRow[]; title: string }) {
	const labels = [
		"Annuelle brute moyenne",
		"Annuelle brute médiane",
		"Horaire brute moyenne",
		"Horaire brute médiane",
	];

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
					{labels.map((label) => {
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

function VariablePaySection({ data }: { data: DeclarationPdfData }) {
	return (
		<>
			<PayGapTable
				rows={data.step3Data.rows}
				title="Écart de rémunération variable ou complémentaire"
			/>
			{data.step3Data.rows.length > 0 && (
				<View style={styles.proportionRow}>
					<View style={styles.proportionItem}>
						<Text style={styles.proportionLabel}>
							Proportion de bénéficiaires — Femmes
						</Text>
						<Text style={styles.proportionValue}>
							{data.step3Data.beneficiaryWomen
								? `${data.step3Data.beneficiaryWomen} %`
								: "-"}
						</Text>
					</View>
					<View style={styles.proportionItem}>
						<Text style={styles.proportionLabel}>
							Proportion de bénéficiaires — Hommes
						</Text>
						<Text style={styles.proportionValue}>
							{data.step3Data.beneficiaryMen
								? `${data.step3Data.beneficiaryMen} %`
								: "-"}
						</Text>
					</View>
				</View>
			)}
		</>
	);
}

function QuartileSection({ data }: { data: DeclarationPdfData }) {
	const annualQuartiles = data.step4Categories.filter((c) =>
		c.name.startsWith("annual:"),
	);
	const hourlyQuartiles = data.step4Categories.filter((c) =>
		c.name.startsWith("hourly:"),
	);

	const renderQuartileTable = (
		quartiles: typeof annualQuartiles,
		prefix: string,
		tableTitle: string,
	) => (
		<View>
			<Text style={styles.sectionLabel}>{tableTitle}</Text>
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

	return (
		<View style={styles.card}>
			<Text style={styles.cardTitle}>
				Proportion de femmes et d&apos;hommes dans chaque quartile salarial
			</Text>
			{annualQuartiles.length > 0 || hourlyQuartiles.length > 0 ? (
				<>
					{annualQuartiles.length > 0 &&
						renderQuartileTable(
							annualQuartiles,
							"annual",
							"Rémunération annuelle brute moyenne",
						)}
					{hourlyQuartiles.length > 0 &&
						renderQuartileTable(
							hourlyQuartiles,
							"hourly",
							"Rémunération horaire brute moyenne",
						)}
				</>
			) : (
				<Text style={styles.noData}>Aucune donnée renseignée.</Text>
			)}
		</View>
	);
}

function CategorySection({ data }: { data: DeclarationPdfData }) {
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

type Props = {
	data: DeclarationPdfData;
};

export function DeclarationPdfDocument({ data }: Props) {
	return (
		<Document>
			<Page size="A4" style={styles.page}>
				<View style={styles.header}>
					<Text style={styles.title}>
						Déclaration des indicateurs de rémunération {data.year}
					</Text>
					<Text style={styles.subtitle}>
						Au titre des données {data.year - 1}
					</Text>
					<Text style={styles.companyInfo}>
						{data.companyName} — SIREN {data.siren}
					</Text>
				</View>

				<WorkforceSection data={data} />
				<PayGapTable rows={data.step2Rows} title="Écart de rémunération" />
				<VariablePaySection data={data} />
				<QuartileSection data={data} />
				<CategorySection data={data} />

				<Text style={styles.footer}>
					Document généré le{" "}
					{new Date().toLocaleDateString("fr-FR", {
						day: "numeric",
						month: "long",
						year: "numeric",
					})}
				</Text>
			</Page>
		</Document>
	);
}
