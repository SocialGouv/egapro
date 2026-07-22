import { Document, Page, Text, View } from "@react-pdf/renderer";

import { formatSiren } from "~/modules/domain";

import { ensurePdfFontsRegistered } from "./pdfFonts";
import { styles } from "./recapPdfStyles";
import { CategorySection } from "./sections/CategorySection";
import { EgaproBanner } from "./sections/EgaproBanner";
import { SectionBanner } from "./sections/headings";
import { InfoSection } from "./sections/InfoSection";
import { PayGapTable } from "./sections/PayGapTable";
import { PdfPageFooter } from "./sections/PdfPageFooter";
import { PdfPageHeader } from "./sections/PdfPageHeader";
import { QuartileSection } from "./sections/QuartileSection";
import { VariablePaySection } from "./sections/VariablePaySection";
import { WorkforceSection } from "./sections/WorkforceSection";
import type { DeclarationPdfData } from "./types";

type Props = {
	data: DeclarationPdfData;
};

function buildTitle(data: DeclarationPdfData): string {
	return data.isSecondDeclaration
		? `Récapitulatif de la seconde déclaration des écarts de rémunération par catégorie de salariés ${data.year}`
		: `Récapitulatif de la déclaration des indicateurs de rémunération ${data.year}`;
}

function formatNaf(nafCode: string | null, nafLabel: string | null): string {
	if (!nafCode && !nafLabel) return "-";
	if (nafCode && nafLabel) return `${nafCode} - ${nafLabel}`;
	return nafCode ?? nafLabel ?? "-";
}

export function DeclarationPdfDocument({ data }: Props) {
	ensurePdfFontsRegistered();

	const step2Rows = [
		{
			label: "Annuelle brute moyenne",
			women: data.step2Data.indicatorAAnnualWomen,
			men: data.step2Data.indicatorAAnnualMen,
		},
		{
			label: "Horaire brute moyenne",
			women: data.step2Data.indicatorAHourlyWomen,
			men: data.step2Data.indicatorAHourlyMen,
		},
		{
			label: "Annuelle brute médiane",
			women: data.step2Data.indicatorCAnnualWomen,
			men: data.step2Data.indicatorCAnnualMen,
		},
		{
			label: "Horaire brute médiane",
			women: data.step2Data.indicatorCHourlyWomen,
			men: data.step2Data.indicatorCHourlyMen,
		},
	];

	return (
		<Document>
			<Page size="A4" style={styles.page} wrap>
				<PdfPageHeader />
				<PdfPageFooter
					siren={data.company.siren}
					transmittedAt={data.transmittedAt}
					year={data.year}
				/>

				<EgaproBanner />

				<View style={styles.content}>
					<View style={styles.titleBlock}>
						<Text style={styles.title}>{buildTitle(data)}</Text>
						<Text style={styles.titleDate}>
							La déclaration a été transmise le {data.transmittedAt}
						</Text>
					</View>

					<InfoSection
						rows={[
							{ label: "Nom Prénom", value: data.declarant.name },
							{ label: "Adresse email", value: data.declarant.email },
							{ label: "Numéro de téléphone", value: data.declarant.phone },
						]}
						title="Informations déclarant"
					/>
					<InfoSection
						rows={[
							{ label: "Raison sociale", value: data.company.name },
							{ label: "SIREN", value: formatSiren(data.company.siren) },
							{ label: "Adresse", value: data.company.address },
							{
								label: "Code NAF",
								value: formatNaf(data.company.nafCode, data.company.nafLabel),
							},
							{
								label: `Effectif annuel moyen en ${data.workforceYear}`,
								value: data.company.workforceDisplay,
							},
						]}
						title="Informations entreprise"
					/>
					<InfoSection
						rows={[
							{ label: "Période de référence", value: data.referencePeriod },
						]}
						title="Information calcul"
					/>

					{!data.isSecondDeclaration && (
						<>
							<WorkforceSection data={data} />
							<View wrap={false}>
								<SectionBanner title="Écart de rémunération" />
								<PayGapTable rows={step2Rows} />
							</View>
							<VariablePaySection data={data} />
							<QuartileSection data={data} />
						</>
					)}

					<CategorySection data={data} />
				</View>
			</Page>
		</Document>
	);
}
