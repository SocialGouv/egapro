import { Document, Page, Text, View } from "@react-pdf/renderer";
import { formatLongDate } from "~/modules/domain";
import type {
	TransmittedPdfData,
	TransmittedPdfFile,
	TransmittedPdfOpinion,
} from "./buildTransmittedPdfData";
import { ensurePdfFontsRegistered } from "./pdfFonts";
import { styles } from "./pdfStyles";
import { normalizePdfText } from "./sections/tableParts";
import { pdfDocumentMetadata } from "./tagging/pdfDocumentMetadata";
import { pdfHeading, pdfTag } from "./tagging/pdfStructure";

type Props = {
	data: TransmittedPdfData;
};

function formatDate(dateStr: string | null): string {
	if (!dateStr) return "Non renseignée";
	return dateStr;
}

function formatOpinionType(type: string): string {
	switch (type) {
		case "favorable":
			return "Favorable";
		case "unfavorable":
			return "Défavorable";
		case "none":
			return "Aucun avis";
		default:
			return type;
	}
}

function formatDeclarationLabel(declarationNumber: number): string {
	if (declarationNumber === 1) return "1re déclaration";
	if (declarationNumber === 2) return "2e déclaration";
	return `${declarationNumber}e déclaration`;
}

function groupOpinionsByDeclaration(
	opinions: TransmittedPdfOpinion[],
): Map<number, TransmittedPdfOpinion[]> {
	const grouped = new Map<number, TransmittedPdfOpinion[]>();
	for (const opinion of opinions) {
		const existing = grouped.get(opinion.declarationNumber) ?? [];
		grouped.set(opinion.declarationNumber, [...existing, opinion]);
	}
	return grouped;
}

function OpinionSection({
	declarationNumber,
	opinions,
}: {
	declarationNumber: number;
	opinions: TransmittedPdfOpinion[];
}) {
	return (
		<View {...pdfTag("Sect")} style={styles.categoryBlock}>
			<Text {...pdfHeading(3)} style={styles.sectionLabel}>
				{formatDeclarationLabel(declarationNumber)}
			</Text>
			{opinions.map((opinion) => (
				<View
					{...pdfTag("P")}
					key={`opinion-${declarationNumber}-${opinion.type}`}
					style={styles.tableRow}
				>
					<Text style={styles.tableCellLabel}>Type : {opinion.type}</Text>
					<Text style={styles.tableCellValue}>
						Avis : {formatOpinionType(opinion.opinion ?? "")}
					</Text>
					<Text style={styles.tableCellValue}>
						Date : {formatDate(opinion.opinionDate)}
					</Text>
					<Text style={styles.tableCellValue}>
						Écart consulté : {opinion.gapConsulted ? "Oui" : "Non"}
					</Text>
				</View>
			))}
		</View>
	);
}

function FormalNoticeJointEvaluationSection({
	file,
}: {
	file: TransmittedPdfFile;
}) {
	return (
		<View {...pdfTag("Sect")} style={styles.card}>
			<Text {...pdfHeading(2)} style={styles.cardTitle}>
				Évaluation conjointe - mise en demeure
			</Text>
			<View {...pdfTag("P")} style={styles.tableRow}>
				<Text style={styles.tableCellLabel}>{file.fileName}</Text>
				<Text style={styles.tableCellValue}>
					Déposé le {normalizePdfText(formatLongDate(file.uploadedAt))}
				</Text>
			</View>
		</View>
	);
}

export function TransmittedPdfDocument({ data }: Props) {
	ensurePdfFontsRegistered();

	const groupedOpinions = groupOpinionsByDeclaration(data.opinions);
	const declarationNumbers = [...groupedOpinions.keys()].sort((a, b) => a - b);

	return (
		<Document
			{...pdfDocumentMetadata({
				title: `Récapitulatif des éléments transmis ${data.year + 1}`,
				subject: "Éléments transmis : avis du CSE et évaluation conjointe",
				siren: data.siren,
			})}
		>
			<Page size="A4" style={styles.page}>
				<View style={styles.header}>
					<Text {...pdfHeading(1)} style={styles.title}>
						Récapitulatif des éléments transmis {data.year + 1}
					</Text>
					<Text style={styles.subtitle}>
						Au titre des données {data.dataYear}
					</Text>
					<Text style={styles.companyInfo}>
						{data.companyName} — SIREN {data.siren}
					</Text>
				</View>

				{/* CSE Opinions */}
				<View {...pdfTag("Sect")} style={styles.card}>
					<Text {...pdfHeading(2)} style={styles.cardTitle}>
						Avis du CSE
					</Text>
					{data.opinions.length === 0 ? (
						<Text style={styles.noData}>Aucun avis enregistré</Text>
					) : (
						declarationNumbers.map((num) => {
							const opinions = groupedOpinions.get(num);
							if (!opinions) return null;
							return (
								<OpinionSection
									declarationNumber={num}
									key={`decl-${num}`}
									opinions={opinions}
								/>
							);
						})
					)}
				</View>

				{/* CSE Opinion Files */}
				<View {...pdfTag("Sect")} style={styles.card}>
					<Text {...pdfHeading(2)} style={styles.cardTitle}>
						Fichiers avis CSE
					</Text>
					{data.cseFiles.length === 0 ? (
						<Text style={styles.noData}>Aucun fichier déposé</Text>
					) : (
						data.cseFiles.map((file) => (
							<View
								{...pdfTag("P")}
								key={file.fileName}
								style={styles.tableRow}
							>
								<Text style={styles.tableCellLabel}>{file.fileName}</Text>
								<Text style={styles.tableCellValue}>
									Déposé le {normalizePdfText(formatLongDate(file.uploadedAt))}
								</Text>
							</View>
						))
					)}
				</View>

				{/* Joint Evaluation File */}
				<View {...pdfTag("Sect")} style={styles.card}>
					<Text {...pdfHeading(2)} style={styles.cardTitle}>
						Évaluation conjointe
					</Text>
					{data.jointEvaluationFile ? (
						<View {...pdfTag("P")} style={styles.tableRow}>
							<Text style={styles.tableCellLabel}>
								{data.jointEvaluationFile.fileName}
							</Text>
							<Text style={styles.tableCellValue}>
								Déposé le{" "}
								{normalizePdfText(
									formatLongDate(data.jointEvaluationFile.uploadedAt),
								)}
							</Text>
						</View>
					) : (
						<Text style={styles.noData}>Aucun fichier déposé</Text>
					)}
				</View>

				{data.formalNoticeJointEvaluationFile && (
					<FormalNoticeJointEvaluationSection
						file={data.formalNoticeJointEvaluationFile}
					/>
				)}

				<Text style={styles.footer}>
					Document généré le {normalizePdfText(data.generatedAt)}
				</Text>
			</Page>
		</Document>
	);
}
