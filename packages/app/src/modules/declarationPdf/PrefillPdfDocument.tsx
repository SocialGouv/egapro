import { Document, Page, Text, View } from "@react-pdf/renderer";

import { formatSiren } from "~/modules/domain";

import type { PrefillPdfData } from "./buildPrefillPdfData";
import { ensurePdfFontsRegistered } from "./pdfFonts";
import { prefillLayout, prefillStyles as styles } from "./prefillPdfStyles";
import { EgaproBanner } from "./sections/EgaproBanner";
import { SectionBanner } from "./sections/headings";
import { InfoSection } from "./sections/InfoSection";
import { PayGapTable, step2PayGapRows } from "./sections/PayGapTable";
import { PdfPageFooter } from "./sections/PdfPageFooter";
import { PdfPageHeader } from "./sections/PdfPageHeader";
import { PdfStylesContext } from "./sections/pdfStylesContext";
import { QuartileSection } from "./sections/QuartileSection";
import { VariablePaySection } from "./sections/VariablePaySection";
import { WorkforceSection } from "./sections/WorkforceSection";

function buildTitle(year: number): string {
	return `Données préremplies : Déclaration des indicateurs de rémunération ${year}`;
}

function companyRows(data: PrefillPdfData) {
	const rows = [
		{ label: "Raison sociale", value: data.companyName },
		{ label: "SIREN", value: formatSiren(data.siren) },
		{ label: "Adresse", value: data.address },
		{ label: "Code NAF", value: data.naf },
		{
			label: `Effectif annuel moyen en ${data.workforceYear}`,
			value: data.workforceDisplay,
		},
	];
	return data.cseDisplay === null
		? rows
		: [...rows, { label: "Existence d'un CSE", value: data.cseDisplay }];
}

export function PrefillPdfDocument({ data }: { data: PrefillPdfData }) {
	ensurePdfFontsRegistered();
	const title = buildTitle(data.year);

	return (
		<Document>
			<PdfStylesContext.Provider value={styles}>
				<Page size="A4" style={styles.page} wrap>
					<PdfPageHeader />
					<PdfPageFooter
						label={`${title} - SIREN ${formatSiren(data.siren)}`}
					/>

					<EgaproBanner pictogram="document" />

					<View style={styles.content}>
						<View style={styles.titleBlock}>
							<Text style={styles.title}>{title}</Text>
							<Text style={styles.titleDate}>
								Source : DSN (Déclarations Sociales Nominatives)
							</Text>
						</View>

						<InfoSection
							rows={companyRows(data)}
							title="Informations entreprise"
						/>
						<View style={prefillLayout.sectionGap} />
						{data.referencePeriod !== null && (
							<>
								<InfoSection
									rows={[
										{
											label: "Période de référence",
											value: data.referencePeriod,
										},
									]}
									title="Information calcul"
								/>
								<View style={prefillLayout.sectionGap} />
							</>
						)}

						<WorkforceSection data={data} />
						<View style={prefillLayout.sectionGap} />
						<View wrap={false}>
							<SectionBanner title="Écart de rémunération" />
							<PayGapTable
								gapVariant="favoredSex"
								rows={step2PayGapRows(data)}
							/>
						</View>
						<View style={prefillLayout.sectionGap} />
						<VariablePaySection data={data} gapVariant="favoredSex" />
						<View style={prefillLayout.sectionGap} />
						<QuartileSection data={data} />
					</View>
				</Page>
			</PdfStylesContext.Provider>
		</Document>
	);
}
