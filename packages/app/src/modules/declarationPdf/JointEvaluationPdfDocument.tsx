import { Document, Page, Text, View } from "@react-pdf/renderer";

import type { JointEvaluationRecapData } from "./buildJointEvaluationRecapData";
import { ensurePdfFontsRegistered } from "./pdfFonts";
import { styles } from "./recapPdfStyles";
import { EgaproBanner } from "./sections/EgaproBanner";
import { SectionBanner } from "./sections/headings";
import { InfoSection } from "./sections/InfoSection";
import { PdfPageFooter } from "./sections/PdfPageFooter";
import { PdfPageHeader } from "./sections/PdfPageHeader";

type Props = {
	data: JointEvaluationRecapData;
};

export function JointEvaluationPdfDocument({ data }: Props) {
	ensurePdfFontsRegistered();
	const { company } = data;

	return (
		<Document>
			<Page size="A4" style={styles.page} wrap>
				<PdfPageHeader />
				<PdfPageFooter
					label={`Évaluation conjointe des rémunérations ${data.year} - SIREN ${company.siren} - transmise le ${data.transmittedAt}`}
				/>

				<EgaproBanner />

				<View style={styles.content}>
					<View style={styles.titleBlock}>
						<Text style={styles.title}>
							Récapitulatif : Évaluation conjointe des rémunérations {data.year}
						</Text>
						<Text style={styles.titleDate}>
							L’évaluation conjointe a été transmise le {data.transmittedAt}.
						</Text>
					</View>

					<SectionBanner title="Informations" />
					<InfoSection
						rows={[
							{ label: "Nom Prénom", value: data.declarant.name },
							{ label: "Adresse email", value: data.declarant.email },
							{ label: "Numéro de téléphone", value: data.declarant.phone },
						]}
						title="Déclarant"
						tone="category"
					/>
					<InfoSection
						rows={[
							{ label: "Raison sociale", value: company.name },
							{ label: "SIREN", value: company.siren },
							...(company.location ? [company.location] : []),
							{ label: "Code NAF", value: company.naf },
							{
								label: company.workforceLabel,
								value: company.workforceDisplay,
							},
							...(company.cseDisplay === null
								? []
								: [{ label: "Existence d'un CSE", value: company.cseDisplay }]),
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
					<InfoSection
						rows={[
							{
								label: "Fichiers déposés",
								value: data.file.name,
								detail: data.file.detail,
							},
						]}
						title="Évaluation conjointe des rémunérations"
					/>
				</View>
			</Page>
		</Document>
	);
}
