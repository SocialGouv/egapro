import { join } from "node:path";
import {
	Document,
	Image,
	Page,
	StyleSheet,
	Text,
	View,
} from "@react-pdf/renderer";

import {
	ASSOCIATED_FILE_LABEL,
	SUBMITTED_FILES_TITLE,
	type SubmittedOpinionBlock,
	UNASSOCIATED_FILE_LABEL,
} from "~/modules/cseOpinion/submittedOpinionLabels";

import type { CseOpinionRecapData } from "./buildCseOpinionRecapData";
import { ensurePdfFontsRegistered } from "./pdfFonts";
import { styles } from "./recapPdfStyles";
import { EgaproBanner } from "./sections/EgaproBanner";
import { CategoryBanner, SectionBanner, SubTitle } from "./sections/headings";
import { InfoSection } from "./sections/InfoSection";
import { PdfPageFooter } from "./sections/PdfPageFooter";
import { PdfPageHeader } from "./sections/PdfPageHeader";
import { Cell, normalizePdfText, Row } from "./sections/tableParts";
import { pdfDocumentMetadata } from "./tagging/pdfDocumentMetadata";
import { pdfHeading, pdfStructure, pdfTag } from "./tagging/pdfStructure";

const FILE_COLUMN_WIDTH = 227;
const MARK_SIZE = 12;

const MARK_FILES = {
	associated: "opinion-check.png",
	unassociated: "opinion-dash.png",
} as const;

const localStyles = StyleSheet.create({
	opinionBlock: {
		paddingHorizontal: 8,
		marginBottom: 10,
	},
	opinionRows: {
		marginTop: 4,
		gap: 4,
	},
	markCell: {
		alignItems: "center",
	},
	mark: {
		width: MARK_SIZE,
		height: MARK_SIZE,
	},
});

function markPath(mark: keyof typeof MARK_FILES): string {
	return join(
		process.cwd(),
		"public",
		"assets",
		"declaration-remuneration",
		"pdf",
		MARK_FILES[mark],
	);
}

type Props = {
	data: CseOpinionRecapData;
};

function OpinionBlock({ title, rows }: Omit<SubmittedOpinionBlock, "id">) {
	return (
		<View style={localStyles.opinionBlock} wrap={false}>
			<SubTitle level={4} title={title} />
			<View {...pdfTag("L")} style={localStyles.opinionRows}>
				{rows.map((row) => (
					<View {...pdfTag("LI")} key={row.label} style={styles.infoRow}>
						<Text
							{...pdfTag("Lbl")}
							style={[styles.infoLabelColumn, styles.infoLabel]}
						>
							{row.label}
						</Text>
						<Text
							{...pdfTag("LBody")}
							style={[styles.infoValueColumn, styles.infoValue]}
						>
							{normalizePdfText(row.value)}
						</Text>
					</View>
				))}
			</View>
		</View>
	);
}

function FilesTable({
	columns,
	files,
}: {
	columns: CseOpinionRecapData["fileColumns"];
	files: CseOpinionRecapData["files"];
}) {
	return (
		<View {...pdfTag("Table")} style={styles.table}>
			<View minPresenceAhead={40} wrap={false}>
				<Row>
					<Cell header text={SUBMITTED_FILES_TITLE} width={FILE_COLUMN_WIDTH} />
					{columns.map((column) => (
						<Cell
							header
							key={column.id}
							text={
								column.declarationLabel
									? `${column.label}\n${column.declarationLabel}`
									: column.label
							}
						/>
					))}
				</Row>
			</View>
			{files.map((file) => (
				<View key={file.id} wrap={false}>
					<Row>
						<Cell rowHeader width={FILE_COLUMN_WIDTH}>
							<Text style={styles.cellTextBold}>
								{normalizePdfText(file.name)}
							</Text>
							<Text style={styles.infoDetail}>
								{normalizePdfText(file.detail)}
							</Text>
						</Cell>
						{columns.map((column) => {
							const associated = file.columnIds.includes(column.id);
							return (
								<Cell key={column.id}>
									<View style={localStyles.markCell}>
										<Image
											{...pdfStructure({
												tag: "Figure",
												alt: associated
													? ASSOCIATED_FILE_LABEL
													: UNASSOCIATED_FILE_LABEL,
											})}
											src={markPath(associated ? "associated" : "unassociated")}
											style={localStyles.mark}
										/>
									</View>
								</Cell>
							);
						})}
					</Row>
				</View>
			))}
		</View>
	);
}

export function CseOpinionPdfDocument({ data }: Props) {
	ensurePdfFontsRegistered();
	const { company } = data;

	return (
		<Document
			{...pdfDocumentMetadata({
				title: `Récapitulatif : Transmission du ou des avis du CSE ${data.year}`,
				subject: "Avis du comité social et économique",
				siren: company.siren,
			})}
		>
			<Page size="A4" style={styles.page} wrap>
				<PdfPageHeader />
				<PdfPageFooter
					label={`Transmission du ou des avis du CSE ${data.year} - SIREN ${company.siren} - transmise le ${data.transmittedAt}`}
				/>

				<EgaproBanner />

				<View style={styles.content}>
					<View style={styles.titleBlock}>
						<Text {...pdfHeading(1)} style={styles.title}>
							Récapitulatif : Transmission du ou des avis du CSE {data.year}
						</Text>
						<Text style={styles.titleDate}>
							Les éléments ont été transmis le {data.transmittedAt}.
						</Text>
					</View>

					<SectionBanner title="Informations" />
					<InfoSection
						rows={data.declarantRows}
						title="Déclarant"
						tone="category"
					/>
					<InfoSection
						rows={data.companyRows}
						title="Entreprise"
						tone="category"
					/>
					<InfoSection
						rows={data.referencePeriods}
						title="Calcul"
						tone="category"
					/>

					<SectionBanner title="Avis CSE" />
					{data.declarations.map((declaration) => (
						<View key={declaration.declarationNumber}>
							<View minPresenceAhead={60}>
								<CategoryBanner title={declaration.title} />
							</View>
							{declaration.opinions.map((opinion) => (
								<OpinionBlock
									key={opinion.id}
									rows={opinion.rows}
									title={opinion.title}
								/>
							))}
						</View>
					))}

					<View minPresenceAhead={80}>
						<CategoryBanner title={SUBMITTED_FILES_TITLE} />
					</View>
					<FilesTable columns={data.fileColumns} files={data.files} />
				</View>
			</Page>
		</Document>
	);
}
