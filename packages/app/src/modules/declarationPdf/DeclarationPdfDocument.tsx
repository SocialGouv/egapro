import { Document, Page, Text, View } from "@react-pdf/renderer";

import { companyLocationRow, formatSiren } from "~/modules/domain";

import { formatNaf } from "./formatNaf";
import { ensurePdfFontsRegistered } from "./pdfFonts";
import { styles } from "./recapPdfStyles";
import { CategorySection } from "./sections/CategorySection";
import { EgaproBanner } from "./sections/EgaproBanner";
import { SectionBanner } from "./sections/headings";
import { InfoSection } from "./sections/InfoSection";
import { PayGapTable, step2PayGapRows } from "./sections/PayGapTable";
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

export function DeclarationPdfDocument({ data }: Props) {
	ensurePdfFontsRegistered();
	const location = companyLocationRow({
		countryCode: data.company.countryCode ?? null,
		countryLabel: data.company.countryLabel ?? null,
		departmentLabel: data.company.departmentLabel ?? null,
		domesticAddress: data.company.address,
	});

	return (
		<Document>
			<Page size="A4" style={styles.page} wrap>
				<PdfPageHeader />
				<PdfPageFooter
					label={`Déclaration ${data.year} - SIREN ${formatSiren(data.company.siren)} - transmise le ${data.transmittedAt}`}
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
							...(location ? [location] : []),
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
								<PayGapTable rows={step2PayGapRows(data)} />
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
