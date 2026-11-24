import { and, desc, eq, inArray, type SQL, sql } from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";
import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	getRepresentationCampaignYear,
	REPRESENTATION_CAMPAIGN_YEAR_OFFSET,
	toNullableNumber,
	truncateDecimals,
} from "~/modules/domain";
import type {
	PublicRepresentationCompanySource,
	PublicRepresentationDTO,
	PublicRepresentationSource,
	PublicSearchInput,
	RepresentationExportRow,
} from "~/modules/public-api";
import {
	fetchWithinExportLimit,
	PUBLIC_API_EXPORT_HEADERS,
	parsePublicSearchInput,
	publicRepresentationColumns,
	REPRESENTATION_EXPORT_COLUMNS,
	REPRESENTATION_XLSX_HEADERS,
	toPublicCsv,
	toPublicRepresentation,
} from "~/modules/public-api";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { db } from "~/server/db";
import { diffusibleCompanyCondition } from "~/server/db/companyConditions";
import { containsInsensitive } from "~/server/db/likeConditions";
import { releasedRepresentationCampaignJoin } from "~/server/db/publicReleaseConditions";
import {
	campaignDeadlines,
	companies,
	gipMdsData,
	representationDeclarations,
} from "~/server/db/schema";
import { enforcePublicApiRateLimit } from "~/server/services/publicApiRateLimit";
import { publicDeclarationFacetConditions } from "~/server/services/publicDeclarationsService";
import {
	servePublicExport,
	withPublicExportSlot,
} from "~/server/services/publicExportCache";

const RECENT_CAMPAIGN_YEARS = 10;

const FORMAT_SCHEMA = z.enum(["csv", "xlsx"]).default("csv");

function campaignYearExpression() {
	return sql<number>`${representationDeclarations.year} + ${REPRESENTATION_CAMPAIGN_YEAR_OFFSET}`;
}

async function publishedCampaignYears(): Promise<number[]> {
	const rows = await db
		.selectDistinct({ year: representationDeclarations.year })
		.from(representationDeclarations)
		.innerJoin(campaignDeadlines, releasedRepresentationCampaignJoin())
		.where(eq(representationDeclarations.status, "submitted"))
		.orderBy(desc(representationDeclarations.year))
		.limit(RECENT_CAMPAIGN_YEARS);
	return rows.map((row) => getRepresentationCampaignYear(Number(row.year)));
}

function exportFilters(
	input: PublicSearchInput,
	campaignYears: number[],
): SQL[] {
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
	conditions.push(
		input.year === undefined
			? inArray(campaignYearExpression(), campaignYears)
			: eq(campaignYearExpression(), input.year),
	);
	return conditions;
}

function publishableRepresentations<Query extends PgSelect>(
	query: Query,
	input: PublicSearchInput,
	campaignYears: number[],
	limit: number,
) {
	return query
		.innerJoin(companies, eq(representationDeclarations.siren, companies.siren))
		.innerJoin(campaignDeadlines, releasedRepresentationCampaignJoin())
		.leftJoin(
			gipMdsData,
			and(
				eq(gipMdsData.siren, representationDeclarations.siren),
				eq(gipMdsData.year, representationDeclarations.year),
			),
		)
		.where(
			and(
				eq(representationDeclarations.status, "submitted"),
				...exportFilters(input, campaignYears),
			),
		)
		.orderBy(representationDeclarations.year, companies.siren)
		.limit(limit);
}

function fetchPublishableRepresentations(
	input: PublicSearchInput,
	campaignYears: number[],
	limit: number,
) {
	const query = db
		.select({
			...publicRepresentationColumns,
			campaignYear: campaignYearExpression(),
			siren: companies.siren,
			name: companies.name,
			address: companies.address,
			region: companies.region,
			departmentCode: companies.departmentCode,
			departmentLabel: companies.departmentLabel,
			countryCode: companies.countryCode,
			countryLabel: companies.countryLabel,
			nafCode: companies.nafCode,
			nafLabel: companies.nafLabel,
			statutDiffusion: companies.statutDiffusion,
			workforceEma: gipMdsData.workforceEma,
		})
		.from(representationDeclarations)
		.$dynamic();
	return publishableRepresentations(query, input, campaignYears, limit);
}

function probePublishableRepresentations(
	input: PublicSearchInput,
	campaignYears: number[],
	limit: number,
) {
	const query = db
		.select({ siren: representationDeclarations.siren })
		.from(representationDeclarations)
		.$dynamic();
	return publishableRepresentations(query, input, campaignYears, limit);
}

type RepresentationRow = Awaited<
	ReturnType<typeof fetchPublishableRepresentations>
>[number];

function toCompanySource(
	row: RepresentationRow,
): PublicRepresentationCompanySource {
	return {
		siren: row.siren,
		name: row.name,
		address: row.address,
		region: row.region,
		departmentCode: row.departmentCode,
		departmentLabel: row.departmentLabel,
		countryCode: row.countryCode,
		countryLabel: row.countryLabel,
		nafCode: row.nafCode,
		nafLabel: row.nafLabel,
		statutDiffusion: row.statutDiffusion,
	};
}

function truncatedPercent(value: number | null): number | null {
	return value === null ? null : truncateDecimals(value);
}

function toExportRow(row: RepresentationRow): RepresentationExportRow {
	const dto: PublicRepresentationDTO = toPublicRepresentation(
		row satisfies PublicRepresentationSource,
		toCompanySource(row),
	);
	return {
		...dto,
		campaignYear: Number(row.campaignYear),
		workforceEma: toNullableNumber(row.workforceEma),
		executiveWomenPercent: truncatedPercent(dto.executiveWomenPercent),
		executiveMenPercent: truncatedPercent(dto.executiveMenPercent),
		memberWomenPercent: truncatedPercent(dto.memberWomenPercent),
		memberMenPercent: truncatedPercent(dto.memberMenPercent),
	};
}

function csvExportResponse(body: string, year?: number) {
	return new NextResponse(body, {
		headers: {
			...PUBLIC_API_EXPORT_HEADERS,
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": `attachment; filename="${year === undefined ? "indicateurs-representation" : `Indicateurs_representation_${year}`}.csv"`,
		},
	});
}

async function formatWorkbook(
	rows: RepresentationExportRow[],
): Promise<Uint8Array<ArrayBuffer>> {
	const workbook = new ExcelJS.Workbook();
	workbook.creator = "EgaPro";
	workbook.created = new Date();
	const sheet = workbook.addWorksheet("Représentation équilibrée");
	sheet.columns = REPRESENTATION_XLSX_HEADERS.map((key) => ({
		header: key,
		key,
		width: key === "name" || key === "address" ? 30 : 20,
	}));
	for (const row of rows) sheet.addRow(row);
	sheet.getRow(1).font = { bold: true };
	const buffer = await workbook.xlsx.writeBuffer();
	const bytes = new Uint8Array(new ArrayBuffer(buffer.byteLength));
	bytes.set(new Uint8Array(buffer));
	return bytes;
}

export function OPTIONS(): Response {
	return new Response(null, {
		status: 204,
		headers: PUBLIC_API_EXPORT_HEADERS,
	});
}

export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.PUBLIC_REPRESENTATIONS_EXPORT,
		resolveContext: (request) => {
			const url = new URL(request.url);
			const parsed = FORMAT_SCHEMA.safeParse(
				url.searchParams.get("format") ?? "csv",
			);
			if (!parsed.success) return { metadata: { invalidParam: "format" } };
			const rawYear = url.searchParams.get("year");
			const year =
				rawYear && /^\d{1,4}$/.test(rawYear) ? Number(rawYear) : null;
			return { metadata: { format: parsed.data, year } };
		},
	},
	async (request) => {
		try {
			const limited = await enforcePublicApiRateLimit(request);
			if (limited) return limited;
			const { searchParams } = new URL(request.url);
			const formatResult = FORMAT_SCHEMA.safeParse(
				searchParams.get("format") ?? "csv",
			);
			if (!formatResult.success) {
				return NextResponse.json(
					{ error: "Le paramètre format doit être 'csv' ou 'xlsx'" },
					{ status: 400, headers: PUBLIC_API_EXPORT_HEADERS },
				);
			}
			const format = formatResult.data;
			const inputResult = parsePublicSearchInput(searchParams);
			if (!inputResult.success) {
				return NextResponse.json(
					{ error: "Paramètres de filtre invalides." },
					{ status: 400, headers: PUBLIC_API_EXPORT_HEADERS },
				);
			}

			const input = inputResult.data;
			const campaignYears =
				input.year === undefined ? await publishedCampaignYears() : [];

			if (format === "xlsx") {
				const workbook = await withPublicExportSlot(async () => {
					const rows = await fetchWithinExportLimit(
						format,
						(limit) =>
							fetchPublishableRepresentations(input, campaignYears, limit),
						(limit) =>
							probePublishableRepresentations(input, campaignYears, limit),
					);
					return rows instanceof Response
						? rows
						: formatWorkbook(rows.map(toExportRow));
				});
				if (workbook instanceof Response) return workbook;
				return new NextResponse(workbook, {
					headers: {
						...PUBLIC_API_EXPORT_HEADERS,
						"Content-Type":
							"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
						"Content-Disposition":
							'attachment; filename="index-egapro-representations-equilibrees.xlsx"',
					},
				});
			}

			const body = await servePublicExport(
				"representations:csv",
				input,
				async () => {
					const rows = await fetchWithinExportLimit(format, (limit) =>
						fetchPublishableRepresentations(input, campaignYears, limit),
					);
					return rows instanceof Response
						? rows
						: toPublicCsv(REPRESENTATION_EXPORT_COLUMNS, rows.map(toExportRow));
				},
			);
			return body instanceof Response
				? body
				: csvExportResponse(body, input.year);
		} catch (error) {
			console.error(
				"[api/public/representations/export]",
				error instanceof Error ? error.message : "unknown error",
			);
			return NextResponse.json(
				{ error: "Erreur lors de l'export des représentations équilibrées" },
				{ status: 500, headers: PUBLIC_API_EXPORT_HEADERS },
			);
		}
	},
);
