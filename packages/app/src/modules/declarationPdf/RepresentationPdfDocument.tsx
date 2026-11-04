import { Document, Page, Text, View } from "@react-pdf/renderer";
import { formatOptionalIsoDate, formatPercentage } from "~/modules/domain";

import type {
	RepresentationPdfData,
	RepresentationPdfIndicator,
} from "./buildRepresentationPdfData";
import { ensurePdfFontsRegistered } from "./pdfFonts";
import type { PdfStyles } from "./recapPdfStyles";
import { representationStyles as styles } from "./representationPdfStyles";
import { EgaproBanner } from "./sections/EgaproBanner";
import { CategoryBanner, SectionBanner } from "./sections/headings";
import { InfoSection } from "./sections/InfoSection";
import { PdfPageFooter } from "./sections/PdfPageFooter";
import { PdfPageHeader } from "./sections/PdfPageHeader";
import { Cell, Row, Table } from "./sections/tableParts";
import { pdfDocumentMetadata } from "./tagging/pdfDocumentMetadata";
import { pdfHeading, pdfTag } from "./tagging/pdfStructure";

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
		<View {...pdfTag("Sect")} style={styles.repGapColumn}>
			<Text {...pdfHeading(3)} style={styles.repGapColumnTitle}>
				{indicator.title}
			</Text>
			{indicator.notComputableReason === null ? (
				<Table sheet={styles}>
					<Row>
						<Cell flex={1} header sheet={styles} text="Femmes" />
						<Cell flex={1} header sheet={styles} text="Hommes" />
						<Cell header sheet={styles} text="Conformité" width={101} />
					</Row>
					<Row>
						<Cell
							align="right"
							flex={1}
							sheet={styles}
							text={formatPercentage(indicator.womenPercent)}
						/>
						<Cell
							align="right"
							flex={1}
							sheet={styles}
							text={formatPercentage(indicator.menPercent)}
						/>
						<Cell sheet={styles} width={101}>
							<VerdictBadge verdict={indicator.verdict} />
						</Cell>
					</Row>
				</Table>
			) : (
				<>
					<Text style={styles.repNotComputableReason}>
						{indicator.notComputableReason}
					</Text>
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
		<Document
			{...pdfDocumentMetadata({
				title: `Récapitulatif : Démarche des indicateurs de représentation ${data.campaignYear}`,
				subject: "Indicateurs de représentation femmes-hommes",
				siren: data.siren,
			})}
		>
			<Page size="A4" style={styles.page} wrap>
				<PdfPageHeader sheet={styles} />
				<PdfPageFooter label={footerLabel} />

				<EgaproBanner sheet={styles} />

				<View style={styles.content}>
					<View style={styles.titleBlock}>
						<Text {...pdfHeading(1)} style={styles.title}>
							Récapitulatif : Démarche des indicateurs de représentation{" "}
							{data.campaignYear}
						</Text>
						<Text style={styles.titleDate}>{transmittedLabel}</Text>
					</View>

					<SectionBanner sheet={styles} title="Informations" />

					{data.declarantRows.length > 0 ? (
						<View style={styles.repCategoryBannerGroup}>
							<InfoSection
								rows={data.declarantRows}
								sheet={styles}
								title="Déclarant"
								tone="category"
							/>
						</View>
					) : (
						<View style={styles.repCategoryBannerGroup} wrap={false}>
							<CategoryBanner title="Déclarant" />
							<Text style={styles.declarantEmptyText}>Non renseigné</Text>
						</View>
					)}

					<View style={styles.repCategoryBannerGroup}>
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
							sheet={styles}
							title="Entreprise"
							tone="category"
						/>
					</View>

					<View style={styles.repCategoryBannerGroup}>
						<InfoSection
							rows={[
								{ label: "Période de référence", value: data.referencePeriod },
							]}
							sheet={styles}
							title="Calcul"
							tone="category"
						/>
					</View>

					<SectionBanner sheet={styles} title="Écarts de représentation" />
					<View style={styles.repGapColumnsRow}>
						{data.indicators.map((indicator) => (
							<IndicatorColumn indicator={indicator} key={indicator.title} />
						))}
					</View>

					{data.publicationApplicable ? (
						<View style={styles.repCategoryBannerGroup}>
							<InfoSection
								rows={publicationRows(data)}
								sheet={styles}
								title="Publication"
								tone="category"
							/>
						</View>
					) : null}
				</View>
			</Page>
		</Document>
	);
}
