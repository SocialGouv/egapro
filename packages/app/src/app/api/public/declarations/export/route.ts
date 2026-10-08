import { and, eq, isNull } from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";
import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AUDIT_ACTIONS } from "~/modules/audit";
import { toCsvField } from "~/modules/domain";
import type {
	PublicCompanySource,
	PublicDeclarationDTO,
	PublicSearchInput,
} from "~/modules/public-api";
import {
	fetchWithinExportLimit,
	PUBLIC_API_EXPORT_HEADERS,
	parsePublicSearchInput,
	publicDeclarationColumns,
	toPublicDeclaration,
} from "~/modules/public-api";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { db } from "~/server/db";
import { diffusibleCompanyCondition } from "~/server/db/companyConditions";
import { containsInsensitive } from "~/server/db/likeConditions";
import { publiclyReleasedCampaignCondition } from "~/server/db/publicReleaseConditions";
import {
	campaignDeadlines,
	companies,
	declarations,
	gipMdsData,
} from "~/server/db/schema";
import { enforcePublicApiRateLimit } from "~/server/services/publicApiRateLimit";
import { publicDeclarationFacetConditions } from "~/server/services/publicDeclarationsService";
import {
	servePublicExport,
	withPublicExportSlot,
} from "~/server/services/publicExportCache";

export function OPTIONS(): Response {
	return new Response(null, {
		status: 204,
		headers: PUBLIC_API_EXPORT_HEADERS,
	});
}

function exportFilters(input: PublicSearchInput) {
	const conditions = publicDeclarationFacetConditions(input);
	if (input.q) {
		const siren = input.q.replace(/\s/g, "");
		const queryFilter = /^\d{9}$/.test(siren)
			? eq(declarations.siren, siren)
			: and(
					diffusibleCompanyCondition(),
					containsInsensitive(companies.name, input.q),
				);
		if (queryFilter) conditions.push(queryFilter);
	}
	if (input.year) conditions.push(eq(declarations.year, input.year));
	return conditions;
}

function publishableDeclarations<Query extends PgSelect>(
	query: Query,
	input: PublicSearchInput,
	limit: number,
) {
	return query
		.innerJoin(companies, eq(declarations.siren, companies.siren))
		.innerJoin(
			campaignDeadlines,
			and(
				eq(campaignDeadlines.year, declarations.year),
				publiclyReleasedCampaignCondition(),
			),
		)
		.leftJoin(
			gipMdsData,
			and(
				eq(gipMdsData.siren, declarations.siren),
				eq(gipMdsData.year, declarations.year),
			),
		)
		.where(
			and(
				eq(declarations.status, "demarche_completed"),
				isNull(declarations.cancelledAt),
				...exportFilters(input),
			),
		)
		.orderBy(declarations.year, companies.siren)
		.limit(limit);
}

function fetchPublishableDeclarations(input: PublicSearchInput, limit: number) {
	const query = db
		.select({
			...publicDeclarationColumns,
			siren: companies.siren,
			name: companies.name,
			address: companies.address,
			city: companies.city,
			regionCode: companies.regionCode,
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
		.from(declarations)
		.$dynamic();
	return publishableDeclarations(query, input, limit);
}

function probePublishableDeclarations(input: PublicSearchInput, limit: number) {
	const query = db
		.select({ siren: declarations.siren })
		.from(declarations)
		.$dynamic();
	return publishableDeclarations(query, input, limit);
}

type ExportRow = Awaited<
	ReturnType<typeof fetchPublishableDeclarations>
>[number];

function toPublicDTO(row: ExportRow): PublicDeclarationDTO {
	const companySource: PublicCompanySource = {
		siren: row.siren,
		name: row.name,
		address: row.address,
		city: row.city,
		regionCode: row.regionCode,
		region: row.region,
		departmentCode: row.departmentCode,
		departmentLabel: row.departmentLabel,
		countryCode: row.countryCode,
		countryLabel: row.countryLabel,
		nafCode: row.nafCode,
		nafLabel: row.nafLabel,
		statutDiffusion: row.statutDiffusion ?? null,
		workforceEma: row.workforceEma ?? null,
	};

	return toPublicDeclaration(row, companySource);
}

const CSV_HEADERS: Array<keyof PublicDeclarationDTO> = [
	"year",
	"siren",
	"name",
	"address",
	"city",
	"regionCode",
	"region",
	"departmentCode",
	"departmentLabel",
	"countryCode",
	"countryLabel",
	"nafCode",
	"nafLabel",
	"workforceEma",
	"totalWomen",
	"totalMen",
	"globalAnnualMeanGap",
	"globalAnnualMedianGap",
	"globalHourlyMeanGap",
	"globalHourlyMedianGap",
	"variableAnnualMeanGap",
	"variableAnnualMedianGap",
	"variableHourlyMeanGap",
	"variableHourlyMedianGap",
	"variableProportionWomen",
	"variableProportionMen",
	"annualQuartile1ProportionWomen",
	"annualQuartile2ProportionWomen",
	"annualQuartile3ProportionWomen",
	"annualQuartile4ProportionWomen",
	"annualQuartile1ProportionMen",
	"annualQuartile2ProportionMen",
	"annualQuartile3ProportionMen",
	"annualQuartile4ProportionMen",
	"hourlyQuartile1ProportionWomen",
	"hourlyQuartile2ProportionWomen",
	"hourlyQuartile3ProportionWomen",
	"hourlyQuartile4ProportionWomen",
	"hourlyQuartile1ProportionMen",
	"hourlyQuartile2ProportionMen",
	"hourlyQuartile3ProportionMen",
	"hourlyQuartile4ProportionMen",
];

const FORMAT_SCHEMA = z.enum(["json", "csv", "xlsx"]).default("json");

function textExportResponse(format: "json" | "csv", body: string) {
	return new NextResponse(body, {
		headers:
			format === "csv"
				? {
						...PUBLIC_API_EXPORT_HEADERS,
						"Content-Type": "text/csv; charset=utf-8",
						"Content-Disposition":
							'attachment; filename="index-egapro-remunerations.csv"',
					}
				: {
						...PUBLIC_API_EXPORT_HEADERS,
						"Content-Type": "application/json",
					},
	});
}

function formatCsv(rows: PublicDeclarationDTO[]): string {
	const header = CSV_HEADERS.map(toCsvField).join(";");
	const dataRows = rows.map((row) =>
		CSV_HEADERS.map((key) => toCsvField(row[key])).join(";"),
	);
	return [header, ...dataRows].join("\n");
}

async function formatWorkbook(
	rows: PublicDeclarationDTO[],
): Promise<Uint8Array<ArrayBuffer>> {
	const workbook = new ExcelJS.Workbook();
	workbook.creator = "EgaPro";
	workbook.created = new Date();
	const sheet = workbook.addWorksheet("Indicateurs A-F", {
		views: [{ state: "frozen", ySplit: 1 }],
	});
	sheet.columns = CSV_HEADERS.map((key) => ({
		header: key,
		key,
		width: key === "name" || key === "address" ? 30 : 18,
	}));
	for (const row of rows) sheet.addRow(row);
	sheet.autoFilter = {
		from: "A1",
		to: `${sheet.getColumn(CSV_HEADERS.length).letter}1`,
	};
	sheet.getRow(1).font = { bold: true };
	const buffer = await workbook.xlsx.writeBuffer();
	const bytes = new Uint8Array(new ArrayBuffer(buffer.byteLength));
	bytes.set(new Uint8Array(buffer));
	return bytes;
}

export const GET = withAuditedRoute(
	{
		action: AUDIT_ACTIONS.PUBLIC_DECLARATIONS_EXPORT,
		resolveContext: (request) => {
			const url = new URL(request.url);
			const raw = url.searchParams.get("format") ?? "json";
			const parsed = FORMAT_SCHEMA.safeParse(raw);
			return {
				metadata: parsed.success
					? { format: parsed.data }
					: { invalidParam: "format" },
			};
		},
	},
	async (request) => {
		try {
			const limited = await enforcePublicApiRateLimit(request);
			if (limited) return limited;
			const { searchParams } = new URL(request.url);
			const formatResult = FORMAT_SCHEMA.safeParse(
				searchParams.get("format") ?? "json",
			);
			if (!formatResult.success) {
				return NextResponse.json(
					{ error: "Le paramètre format doit être 'json', 'csv' ou 'xlsx'" },
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

			if (format === "xlsx") {
				const workbook = await withPublicExportSlot(async () => {
					const rows = await fetchWithinExportLimit(
						format,
						(limit) => fetchPublishableDeclarations(input, limit),
						(limit) => probePublishableDeclarations(input, limit),
					);
					return rows instanceof Response
						? rows
						: formatWorkbook(rows.map(toPublicDTO));
				});
				if (workbook instanceof Response) return workbook;
				return new NextResponse(workbook, {
					headers: {
						...PUBLIC_API_EXPORT_HEADERS,
						"Content-Type":
							"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
						"Content-Disposition":
							'attachment; filename="index-egapro-remunerations.xlsx"',
					},
				});
			}

			const body = await servePublicExport(
				`declarations:${format}`,
				input,
				async () => {
					const rows = await fetchWithinExportLimit(format, (limit) =>
						fetchPublishableDeclarations(input, limit),
					);
					if (rows instanceof Response) return rows;
					const data = rows.map(toPublicDTO);
					return format === "csv"
						? formatCsv(data)
						: JSON.stringify({ data, count: data.length });
				},
			);
			return body instanceof Response ? body : textExportResponse(format, body);
		} catch (error) {
			console.error(
				"[api/public/declarations/export]",
				error instanceof Error ? error.message : "unknown error",
			);
			return NextResponse.json(
				{ error: "Erreur lors de l'export des déclarations" },
				{ status: 500, headers: PUBLIC_API_EXPORT_HEADERS },
			);
		}
	},
);
