import "server-only";

import { and, eq } from "drizzle-orm";
import ExcelJS from "exceljs";

import { toCsvField, toNullableNumber } from "~/modules/domain";
import {
	maskNonDiffusibleRepresentation,
	type PublicSearchInput,
} from "~/modules/public-api";
import type { DB } from "~/server/db";
import { diffusibleCompanyCondition } from "~/server/db/companyConditions";
import { containsInsensitive } from "~/server/db/likeConditions";
import { releasedRepresentationCampaignJoin } from "~/server/db/publicReleaseConditions";
import {
	campaignDeadlines,
	companies,
	gipMdsData,
	representationDeclarations,
} from "~/server/db/schema";
import { publicDeclarationFacetConditions } from "~/server/services/publicDeclarationsService";

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

function representationExportFilters(input: PublicSearchInput) {
	const conditions = publicDeclarationFacetConditions(input);
	if (input.q) {
		const siren = input.q.replace(/\s/g, "");
		const queryFilter = /^\d{9}$/.test(siren)
			? eq(representationDeclarations.siren, siren)
			: and(
					diffusibleCompanyCondition(),
					containsInsensitive(companies.name, input.q),
				);
		if (queryFilter) conditions.push(queryFilter);
	}
	if (input.year) {
		conditions.push(eq(representationDeclarations.year, input.year));
	}
	return conditions;
}

async function fetchSubmittedRepresentationDeclarations(
	db: DB,
	input: PublicSearchInput | undefined,
	limit: number,
) {
	const submitted = eq(representationDeclarations.status, "submitted");
	const filters = input ? representationExportFilters(input) : [];
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
			identityDiffusible: diffusibleCompanyCondition(),
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
		.innerJoin(campaignDeadlines, releasedRepresentationCampaignJoin())
		.leftJoin(
			gipMdsData,
			and(
				eq(gipMdsData.siren, representationDeclarations.siren),
				eq(gipMdsData.year, representationDeclarations.year),
			),
		)
		.where(filters.length > 0 ? and(submitted, ...filters) : submitted)
		.orderBy(representationDeclarations.year, companies.siren)
		.limit(limit);
}

type RepresentationDeclarationRow = Awaited<
	ReturnType<typeof fetchSubmittedRepresentationDeclarations>
>[number];

function toExportRow(
	row: RepresentationDeclarationRow,
): RepresentationExportRow {
	return maskNonDiffusibleRepresentation(
		{
			referenceYear: row.year,
			siren: row.siren,
			name: row.name,
			region: row.region,
			departmentCode: row.departmentCode,
			departmentLabel: row.departmentLabel,
			nafCode: row.nafCode,
			nafLabel: row.nafLabel,
			executiveWomenPercent: toNullableNumber(row.executiveWomenPercent),
			executiveMenPercent: toNullableNumber(row.executiveMenPercent),
			notComputableReasonExecutives: row.notComputableReasonExecutives,
			memberWomenPercent: toNullableNumber(row.memberWomenPercent),
			memberMenPercent: toNullableNumber(row.memberMenPercent),
			notComputableReasonMembers: row.notComputableReasonMembers,
			publishDate: row.publishDate,
			publishUrl: row.publishUrl,
			publishModalities: row.publishModalities,
		},
		row.identityDiffusible,
	);
}

export async function buildRepresentationExportRows(
	db: DB,
	input: PublicSearchInput | undefined,
	limit: number,
): Promise<RepresentationExportRow[]> {
	const rows = await fetchSubmittedRepresentationDeclarations(db, input, limit);
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

export function generateRepresentationCsv(
	rows: RepresentationExportRow[],
): string {
	const header = REPRESENTATION_EXPORT_COLUMNS.map((col) =>
		toCsvField(col.header),
	).join(";");
	const body = rows.map((row) =>
		REPRESENTATION_EXPORT_COLUMNS.map((col) => toCsvField(row[col.key])).join(
			";",
		),
	);
	return [header, ...body].join("\n");
}
