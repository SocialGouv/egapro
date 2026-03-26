import { Document, Page, Text, View } from "@react-pdf/renderer";

import { ensurePdfFontsRegistered } from "~/modules/declarationPdf/pdfFonts";
import { styles } from "./pdfStyles";
import type { NoSanctionPdfData } from "./types";

type Props = {
	data: NoSanctionPdfData;
};

export function NoSanctionPdfDocument({ data }: Props) {
	ensurePdfFontsRegistered();

	return (
		<Document>
			<Page size="A4" style={styles.page}>
				<View style={styles.header}>
					<Text style={styles.republicTitle}>RÉPUBLIQUE FRANÇAISE</Text>
					<Text style={styles.title}>Attestation de non sanction</Text>
				</View>

				<View style={styles.section}>
					<Text style={styles.body}>
						La présente attestation certifie que l'entreprise ci-dessous n'a
						fait l'objet d'aucune sanction au titre de l'égalité professionnelle
						entre les femmes et les hommes.
					</Text>
				</View>

				<View style={styles.card}>
					<Text style={styles.cardTitle}>Entreprise</Text>
					<Text style={styles.cardField}>
						Raison sociale : {data.companyName}
					</Text>
					<Text style={styles.cardField}>SIREN : {data.siren}</Text>
					{data.address && (
						<Text style={styles.cardField}>Adresse : {data.address}</Text>
					)}
				</View>

				<View style={styles.section}>
					<Text style={styles.body}>
						Cette attestation a été générée automatiquement à partir des données
						transmises par le système SUIT (Suivi des Interventions et des
						Transactions).
					</Text>
				</View>

				<Text style={styles.footer}>Document généré le {data.generatedAt}</Text>
			</Page>
		</Document>
	);
}
