import "server-only";

import { eq } from "drizzle-orm";
import ExcelJS from "exceljs";

import { isCompanyDiffusible, toNumber } from "~/modules/public-api";
import type { DB } from "~/server/db";
import { companies, representationDeclarations } from "~/server/db/schema";

export type RepresentationExportRow = {
	referenceYear: number;
	siren: string;
	name: string | null;
	region: string | null;
	departmentCode: string | null;
	departmentLabel: string | null;
	nafCode: string | null;
	nafLabel: string | null;
	executiveWomenPercent: number | null;
	executiveMenPercent: number | null;
	notComputableReasonExecutives: string | null;
	memberWomenPercent: number | null;
	memberMenPercent: number | null;
	notComputableReasonMembers: string | null;
	publishDate: string | null;
	publishUrl: string | null;
	publishModalities: string | null;
};

const REPRESENTATION_EXPORT_COLUMNS: Array<{
	key: keyof RepresentationExportRow;
	header: string;
}> = [
	{ key: "referenceYear", header: "Annee_reference" },
	{ key: "siren", header: "SIREN" },
	{ key: "name", header: "Raison_sociale" },
	{ key: "region", header: "Region" },
	{ key: "departmentCode", header: "Code_departement" },
	{ key: "departmentLabel", header: "Departement" },
	{ key: "nafCode", header: "Code_NAF" },
	{ key: "nafLabel", header: "Libelle_NAF" },
	{ key: "executiveWomenPercent", header: "Cadres_dirigeants_F" },
	{ key: "executiveMenPercent", header: "Cadres_dirigeants_H" },
	{
		key: "notComputableReasonExecutives",
		header: "Cadres_dirigeants_motif_non_calculabilite",
	},
	{ key: "memberWomenPercent", header: "Instances_dirigeantes_F" },
	{ key: "memberMenPercent", header: "Instances_dirigeantes_H" },
	{
		key: "notComputableReasonMembers",
		header: "Instances_dirigeantes_motif_non_calculabilite",
	},
	{ key: "publishDate", header: "Date_publication" },
	{ key: "publishUrl", header: "Url_publication" },
	{ key: "publishModalities", header: "Modalites_publication" },
];

async function fetchSubmittedRepresentationDeclarations(db: DB) {
	return db
		.select({
			year: representationDeclarations.year,
			siren: companies.siren,
			name: companies.name,
			region: companies.region,
			departmentCode: companies.departmentCode,
			departmentLabel: companies.departmentLabel,
			nafCode: companies.nafCode,
			nafLabel: companies.nafLabel,
			statutDiffusion: companies.statutDiffusion,
			executiveWomenPercent: representationDeclarations.executiveWomenPercent,
			executiveMenPercent: representationDeclarations.executiveMenPercent,
			notComputableReasonExecutives:
				representationDeclarations.notComputableReasonExecutives,
			memberWomenPercent: representationDeclarations.memberWomenPercent,
			memberMenPercent: representationDeclarations.memberMenPercent,
			notComputableReasonMembers:
				representationDeclarations.notComputableReasonMembers,
			publishDate: representationDeclarations.publishDate,
			publishUrl: representationDeclarations.publishUrl,
			publishModalities: representationDeclarations.publishModalities,
		})
		.from(representationDeclarations)
		.innerJoin(companies, eq(representationDeclarations.siren, companies.siren))
		.where(eq(representationDeclarations.status, "submitted"))
		.orderBy(representationDeclarations.year, companies.siren);
}

type RepresentationDeclarationRow = Awaited<
	ReturnType<typeof fetchSubmittedRepresentationDeclarations>
>[number];

function toExportRow(
	row: RepresentationDeclarationRow,
): RepresentationExportRow {
	const diffusible = isCompanyDiffusible(row.statutDiffusion);

	return {
		referenceYear: row.year,
		siren: row.siren,
		name: diffusible ? row.name : null,
		region: diffusible ? row.region : null,
		departmentCode: diffusible ? row.departmentCode : null,
		departmentLabel: diffusible ? row.departmentLabel : null,
		nafCode: diffusible ? row.nafCode : null,
		nafLabel: diffusible ? row.nafLabel : null,
		executiveWomenPercent: toNumber(row.executiveWomenPercent),
		executiveMenPercent: toNumber(row.executiveMenPercent),
		notComputableReasonExecutives: row.notComputableReasonExecutives,
		memberWomenPercent: toNumber(row.memberWomenPercent),
		memberMenPercent: toNumber(row.memberMenPercent),
		notComputableReasonMembers: row.notComputableReasonMembers,
		publishDate: row.publishDate,
		publishUrl: row.publishUrl,
		publishModalities: row.publishModalities,
	};
}

export async function buildRepresentationExportRows(
	db: DB,
): Promise<RepresentationExportRow[]> {
	const rows = await fetchSubmittedRepresentationDeclarations(db);
	return rows.map(toExportRow);
}

export async function generateRepresentationXlsx(
	rows: RepresentationExportRow[],
): Promise<Buffer> {
	const workbook = new ExcelJS.Workbook();
	const sheet = workbook.addWorksheet("Représentation équilibrée");

	sheet.columns = REPRESENTATION_EXPORT_COLUMNS.map((col) => ({
		header: col.header,
		key: String(col.key),
		width: 20,
	}));

	for (const row of rows) {
		const values: Record<string, unknown> = {};
		for (const col of REPRESENTATION_EXPORT_COLUMNS) {
			const val = row[col.key];
			values[String(col.key)] = val === null || val === undefined ? null : val;
		}
		sheet.addRow(values);
	}

	const headerRow = sheet.getRow(1);
	headerRow.font = { bold: true };
	headerRow.alignment = { horizontal: "center" };

	const arrayBuffer = await workbook.xlsx.writeBuffer();
	return Buffer.from(arrayBuffer);
}
