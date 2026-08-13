import { Document, Page, Text, View } from "@react-pdf/renderer";
import {
	formatLongDate,
	formatPercentage,
	formatShortDate,
} from "~/modules/domain";
import type {
	RepresentationPdfData,
	RepresentationPdfIndicator,
} from "./buildRepresentationPdfData";
import { ensurePdfFontsRegistered } from "./pdfFonts";
import { styles } from "./pdfStyles";

type Props = {
	data: RepresentationPdfData;
};

const VERDICT_LABELS = {
	compliant: "Conforme",
	non_compliant: "Non conforme",
	not_applicable: "Non applicable",
} as const;

function formatOptionalDate(value: string | null): string {
	return value === null ? "Non renseignée" : formatShortDate(new Date(value));
}

function IndicatorCard({
	indicator,
}: {
	indicator: RepresentationPdfIndicator;
}) {
	return (
		<View style={styles.card}>
			<Text style={styles.cardTitle}>{indicator.title}</Text>
			{indicator.notComputableReason === null ? (
				<View style={styles.proportionRow}>
					<View style={styles.proportionItem}>
						<Text style={styles.proportionLabel}>Femmes</Text>
						<Text style={styles.proportionValue}>
							{formatPercentage(indicator.womenPercent)}
						</Text>
					</View>
					<View style={styles.proportionItem}>
						<Text style={styles.proportionLabel}>Hommes</Text>
						<Text style={styles.proportionValue}>
							{formatPercentage(indicator.menPercent)}
						</Text>
					</View>
				</View>
			) : (
				<Text style={styles.noData}>{indicator.notComputableReason}</Text>
			)}
			<Text style={styles.sectionLabel}>
				Verdict : {VERDICT_LABELS[indicator.verdict]}
			</Text>
		</View>
	);
}

export function RepresentationPdfDocument({ data }: Props) {
	ensurePdfFontsRegistered();

	return (
		<Document>
			<Page size="A4" style={styles.page}>
				<View style={styles.header}>
					<Text style={styles.title}>
						Démarche des indicateurs de représentation {data.campaignYear}
					</Text>
					<Text style={styles.subtitle}>
						Au titre de la période de référence {data.year}
					</Text>
					<Text style={styles.companyInfo}>
						{data.companyName} — SIREN {data.siren}
					</Text>
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Période de référence</Text>
					<View style={styles.tableRow}>
						<Text style={styles.tableCellLabel}>Début de la période</Text>
						<Text style={styles.tableCellValue}>
							{formatOptionalDate(data.referencePeriodStart)}
						</Text>
					</View>
					<View style={styles.tableRowLast}>
						<Text style={styles.tableCellLabel}>Fin de la période</Text>
						<Text style={styles.tableCellValue}>
							{formatOptionalDate(data.referencePeriodEnd)}
						</Text>
					</View>
				</View>

				{data.indicators.map((indicator) => (
					<IndicatorCard indicator={indicator} key={indicator.title} />
				))}

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Publication</Text>
					{data.publicationApplicable ? (
						<>
							<View style={styles.tableRow}>
								<Text style={styles.tableCellLabel}>Date de publication</Text>
								<Text style={styles.tableCellValue}>
									{formatOptionalDate(data.publishDate)}
								</Text>
							</View>
							{data.hasWebsite ? (
								<View style={styles.tableRowLast}>
									<Text style={styles.tableCellLabel}>
										Adresse de la page (URL)
									</Text>
									<Text style={styles.tableCellValue}>
										{data.publishUrl ?? "—"}
									</Text>
								</View>
							) : (
								<View style={styles.tableRowLast}>
									<Text style={styles.tableCellLabel}>
										Modalités de communication
									</Text>
									<Text style={styles.tableCellValue}>
										{data.publishModalities ?? "—"}
									</Text>
								</View>
							)}
						</>
					) : (
						<Text style={styles.noData}>
							Non applicable — aucun écart calculable
						</Text>
					)}
				</View>

				<Text style={styles.footer}>
					{data.submittedAt
						? `Déclaration transmise le ${formatLongDate(data.submittedAt)} — `
						: ""}
					Document généré le {formatLongDate(data.generatedAt)}
				</Text>
			</Page>
		</Document>
	);
}
