import { Document, Page, Text, View } from "@react-pdf/renderer";
import {
	formatIsoDate,
	formatLongDate,
	formatPercentage,
} from "~/modules/domain";
import type {
	RepresentationPdfData,
	RepresentationPdfIndicator,
} from "./buildRepresentationPdfData";
import { ensurePdfFontsRegistered } from "./pdfFonts";
import { styles } from "./pdfStyles";
import { normalizePdfText } from "./sections/tableParts";
import { pdfDocumentMetadata } from "./tagging/pdfDocumentMetadata";
import { pdfHeading, pdfTag } from "./tagging/pdfStructure";

type Props = {
	data: RepresentationPdfData;
};

const VERDICT_LABELS = {
	compliant: "Conforme",
	non_compliant: "Non conforme",
	not_applicable: "Non calculable",
} as const;

function formatOptionalDate(value: string | null): string {
	return value === null ? "Non renseignée" : formatIsoDate(value);
}

function IndicatorCard({
	indicator,
}: {
	indicator: RepresentationPdfIndicator;
}) {
	return (
		<View {...pdfTag("Sect")} style={styles.card}>
			<Text {...pdfHeading(2)} style={styles.cardTitle}>
				{indicator.title}
			</Text>
			{indicator.notComputableReason === null ? (
				<View style={styles.proportionRow}>
					<View {...pdfTag("P")} style={styles.proportionItem}>
						<Text style={styles.proportionLabel}>Femmes</Text>
						<Text style={styles.proportionValue}>
							{formatPercentage(indicator.womenPercent)}
						</Text>
					</View>
					<View {...pdfTag("P")} style={styles.proportionItem}>
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
		<Document
			{...pdfDocumentMetadata({
				title: `Démarche des indicateurs de représentation ${data.campaignYear}`,
				subject: "Indicateurs de représentation femmes-hommes",
				siren: data.siren,
			})}
		>
			<Page size="A4" style={styles.page}>
				<View style={styles.header}>
					<Text {...pdfHeading(1)} style={styles.title}>
						Démarche des indicateurs de représentation {data.campaignYear}
					</Text>
					<Text style={styles.subtitle}>Au titre des données {data.year}</Text>
					<Text style={styles.companyInfo}>
						{data.companyName} — SIREN {data.siren}
					</Text>
				</View>

				<View {...pdfTag("Sect")} style={styles.card}>
					<Text {...pdfHeading(2)} style={styles.cardTitle}>
						Période de référence
					</Text>
					<View {...pdfTag("P")} style={styles.tableRow}>
						<Text style={styles.tableCellLabel}>Début de la période</Text>
						<Text style={styles.tableCellValue}>
							{formatOptionalDate(data.referencePeriodStart)}
						</Text>
					</View>
					<View {...pdfTag("P")} style={styles.tableRowLast}>
						<Text style={styles.tableCellLabel}>Fin de la période</Text>
						<Text style={styles.tableCellValue}>
							{formatOptionalDate(data.referencePeriodEnd)}
						</Text>
					</View>
				</View>

				{data.indicators.map((indicator) => (
					<IndicatorCard indicator={indicator} key={indicator.title} />
				))}

				<View {...pdfTag("Sect")} style={styles.card}>
					<Text {...pdfHeading(2)} style={styles.cardTitle}>
						Publication
					</Text>
					{data.publicationApplicable ? (
						<>
							<View {...pdfTag("P")} style={styles.tableRow}>
								<Text style={styles.tableCellLabel}>Date de publication</Text>
								<Text style={styles.tableCellValue}>
									{formatOptionalDate(data.publishDate)}
								</Text>
							</View>
							{data.hasWebsite ? (
								<View {...pdfTag("P")} style={styles.tableRowLast}>
									<Text style={styles.tableCellLabel}>
										Adresse de la page (URL)
									</Text>
									<Text style={styles.tableCellValue}>
										{data.publishUrl ?? "—"}
									</Text>
								</View>
							) : (
								<View {...pdfTag("P")} style={styles.tableRowLast}>
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
						? `Déclaration transmise le ${normalizePdfText(formatLongDate(data.submittedAt))} — `
						: ""}
					Document généré le{" "}
					{normalizePdfText(formatLongDate(data.generatedAt))}
				</Text>
			</Page>
		</Document>
	);
}
