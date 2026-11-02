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
	SUBMITTED_FILES_TITLE,
	type SubmittedOpinionBlock,
} from "~/modules/cseOpinion/submittedOpinionLabels";

import type { CseOpinionRecapData } from "./buildCseOpinionRecapData";
import { ensurePdfFontsRegistered } from "./pdfFonts";
import { styles } from "./recapPdfStyles";
import { EgaproBanner } from "./sections/EgaproBanner";
import { CategoryBanner, SectionBanner, SubTitle } from "./sections/headings";
import { InfoSection } from "./sections/InfoSection";
import { PdfPageFooter } from "./sections/PdfPageFooter";
import { PdfPageHeader } from "./sections/PdfPageHeader";
import { Cell, normalizeSpaces, Row } from "./sections/tableParts";

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
			<SubTitle title={title} />
			<View style={localStyles.opinionRows}>
				{rows.map((row) => (
					<View key={row.label} style={styles.infoRow}>
						<Text style={[styles.infoLabelColumn, styles.infoLabel]}>
							{row.label}
						</Text>
						<Text style={[styles.infoValueColumn, styles.infoValue]}>
							{normalizeSpaces(row.value)}
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
		<View style={styles.table}>
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
						<Cell width={FILE_COLUMN_WIDTH}>
							<Text style={styles.cellTextBold}>
								{normalizeSpaces(file.name)}
							</Text>
							<Text style={styles.infoDetail}>
								{normalizeSpaces(file.detail)}
							</Text>
						</Cell>
						{columns.map((column) => (
							<Cell key={column.id}>
								<View style={localStyles.markCell}>
									<Image
										src={markPath(
											file.columnIds.includes(column.id)
												? "associated"
												: "unassociated",
										)}
										style={localStyles.mark}
									/>
								</View>
							</Cell>
						))}
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
		<Document>
			<Page size="A4" style={styles.page} wrap>
				<PdfPageHeader />
				<PdfPageFooter
					label={`Transmission du ou des avis du CSE ${data.year} - SIREN ${company.siren} - transmise le ${data.transmittedAt}`}
				/>

				<EgaproBanner />

				<View style={styles.content}>
					<View style={styles.titleBlock}>
						<Text style={styles.title}>
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
