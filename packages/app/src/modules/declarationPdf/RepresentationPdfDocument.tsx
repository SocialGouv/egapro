import { Document, Page, Text, View } from "@react-pdf/renderer";
import { formatOptionalIsoDate, formatPercentage } from "~/modules/domain";

import type {
	RepresentationPdfData,
	RepresentationPdfIndicator,
} from "./buildRepresentationPdfData";
import { ensurePdfFontsRegistered } from "./pdfFonts";
import { type PdfStyles, styles } from "./recapPdfStyles";
import { EgaproBanner } from "./sections/EgaproBanner";
import { CategoryBanner, SectionBanner } from "./sections/headings";
import { InfoSection } from "./sections/InfoSection";
import { PdfPageFooter } from "./sections/PdfPageFooter";
import { PdfPageHeader } from "./sections/PdfPageHeader";
import { Cell, Row, Table } from "./sections/tableParts";

type Props = {
	data: RepresentationPdfData;
};

const VERDICT_BADGE: Record<
	RepresentationPdfIndicator["verdict"],
	{
		style: PdfStyles[keyof PdfStyles];
		textStyle: PdfStyles[keyof PdfStyles];
		label: string;
	}
> = {
	compliant: {
		style: styles.complianceBadgeCompliant,
		textStyle: styles.complianceBadgeCompliantText,
		label: "CONFORME",
	},
	non_compliant: {
		style: styles.complianceBadgeNonCompliant,
		textStyle: styles.complianceBadgeNonCompliantText,
		label: "NON CONFORME",
	},
	not_applicable: {
		style: styles.complianceBadgeNotApplicable,
		textStyle: styles.complianceBadgeNotApplicableText,
		label: "NON CALCULABLE",
	},
};

function VerdictBadge({
	verdict,
}: {
	verdict: RepresentationPdfIndicator["verdict"];
}) {
	const badge = VERDICT_BADGE[verdict];
	return (
		<View style={badge.style}>
			<Text style={badge.textStyle}>{badge.label}</Text>
		</View>
	);
}

function IndicatorColumn({
	indicator,
}: {
	indicator: RepresentationPdfIndicator;
}) {
	return (
		<View style={styles.repGapColumn}>
			<Text style={styles.repGapColumnTitle}>{indicator.title}</Text>
			{indicator.notComputableReason === null ? (
				<Table>
					<Row>
						<Cell flex={1} header text="Femmes" />
						<Cell flex={1} header text="Hommes" />
						<Cell header text="Conformité" width={101} />
					</Row>
					<Row>
						<Cell
							align="right"
							flex={1}
							text={formatPercentage(indicator.womenPercent)}
						/>
						<Cell
							align="right"
							flex={1}
							text={formatPercentage(indicator.menPercent)}
						/>
						<Cell width={101}>
							<VerdictBadge verdict={indicator.verdict} />
						</Cell>
					</Row>
				</Table>
			) : (
				<>
					<Text style={styles.noData}>{indicator.notComputableReason}</Text>
					<VerdictBadge verdict={indicator.verdict} />
				</>
			)}
		</View>
	);
}

function publicationRows(data: RepresentationPdfData) {
	const rows = [
		{
			label: "Date de publication",
			value: formatOptionalIsoDate(data.publishDate ?? undefined),
		},
		{
			label: "Site internet de publication",
			value: data.hasWebsite ? "Oui" : "Non",
		},
	];
	return data.hasWebsite
		? [
				...rows,
				{
					label: "Adresse de la page (URL)",
					value: data.publishUrl ?? "—",
				},
			]
		: [
				...rows,
				{
					label: "Modalités de communication",
					value: data.publishModalities ?? "—",
				},
			];
}

export function RepresentationPdfDocument({ data }: Props) {
	ensurePdfFontsRegistered();

	const transmittedLabel =
		data.transmittedAt === null
			? "La déclaration a été transmise"
			: `La déclaration a été transmise le ${data.transmittedAt}`;
	const footerLabel = `Démarche des indicateurs de représentation ${data.campaignYear} - SIREN ${data.company.siren}${
		data.transmittedAt === null ? "" : ` - transmise le ${data.transmittedAt}`
	}`;

	return (
		<Document>
			<Page size="A4" style={styles.page} wrap>
				<PdfPageHeader />
				<PdfPageFooter label={footerLabel} />

				<EgaproBanner />

				<View style={styles.content}>
					<View style={styles.titleBlock}>
						<Text style={styles.title}>
							Récapitulatif : Démarche des indicateurs de représentation{" "}
							{data.campaignYear}
						</Text>
						<Text style={styles.titleDate}>{transmittedLabel}</Text>
					</View>

					<SectionBanner title="Informations" />

					{data.declarantRows.length > 0 ? (
						<InfoSection
							rows={data.declarantRows}
							title="Déclarant"
							tone="category"
						/>
					) : (
						<View wrap={false}>
							<CategoryBanner title="Déclarant" />
							<Text style={styles.declarantEmptyText}>Non renseigné</Text>
						</View>
					)}

					<InfoSection
						rows={[
							{ label: "Raison sociale", value: data.company.name },
							{ label: "SIREN", value: data.company.siren },
							...(data.company.location ? [data.company.location] : []),
							{ label: "Code NAF", value: data.company.naf },
							{
								label: data.company.workforceLabel,
								value: data.company.workforceDisplay,
							},
						]}
						title="Entreprise"
						tone="category"
					/>

					<InfoSection
						rows={[
							{ label: "Période de référence", value: data.referencePeriod },
						]}
						title="Calcul"
						tone="category"
					/>

					<SectionBanner title="Écarts de représentation" />
					<View style={styles.repGapColumnsRow}>
						{data.indicators.map((indicator) => (
							<IndicatorColumn indicator={indicator} key={indicator.title} />
						))}
					</View>

					{data.publicationApplicable ? (
						<InfoSection
							rows={publicationRows(data)}
							title="Publication"
							tone="category"
						/>
					) : null}
				</View>
			</Page>
		</Document>
	);
}
