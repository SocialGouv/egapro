import { Document, Page, Text, View } from "@react-pdf/renderer";

import { ensurePdfFontsRegistered } from "./pdfFonts";
import { styles } from "./pdfStyles";
import { CategorySection } from "./sections/CategorySection";
import { PayGapTable } from "./sections/PayGapTable";
import { QuartileSection } from "./sections/QuartileSection";
import { VariablePaySection } from "./sections/VariablePaySection";
import { WorkforceSection } from "./sections/WorkforceSection";
import type { DeclarationPdfData } from "./types";

type Props = {
	data: DeclarationPdfData;
};

export function DeclarationPdfDocument({ data }: Props) {
	ensurePdfFontsRegistered();

	return (
		<Document>
			<Page size="A4" style={styles.page}>
				<View style={styles.header}>
					<Text style={styles.title}>
						{data.isSecondDeclaration
							? `Seconde déclaration de l'indicateur de rémunération par catégorie de salariés ${data.year}`
							: `Déclaration des indicateurs de rémunération ${data.year}`}
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

				<Text style={styles.footer}>Document généré le {data.generatedAt}</Text>
			</Page>
		</Document>
	);
}
