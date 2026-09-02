import { and, eq, ilike, isNotNull, isNull, or, sql } from "drizzle-orm";
import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AUDIT_ACTIONS } from "~/modules/audit";
import type {
	PublicCompanySource,
	PublicDeclarationDTO,
} from "~/modules/public-api";
import {
	PUBLIC_API_EXPORT_HEADERS,
	publicDeclarationColumns,
	toPublicDeclaration,
} from "~/modules/public-api";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { db } from "~/server/db";
import { diffusibleCompanyCondition } from "~/server/db/companyConditions";
import {
	campaignDeadlines,
	companies,
	declarations,
	gipMdsData,
} from "~/server/db/schema";
import { enforcePublicApiRateLimit } from "~/server/services/publicApiRateLimit";
import { nafSectionCondition } from "~/server/services/publicDeclarationsService";

const MAX_XLSX_EXPORT_ROWS = 10_000;

export function OPTIONS(): Response {
	return new Response(null, {
		status: 204,
		headers: PUBLIC_API_EXPORT_HEADERS,
	});
}

function exportFilters(searchParams: URLSearchParams) {
	const conditions = [];
	const q = searchParams.get("q")?.trim();
	if (q) {
		const siren = q.replace(/\s/g, "");
		conditions.push(
			/^\d{9}$/.test(siren)
				? eq(declarations.siren, siren)
				: and(diffusibleCompanyCondition(), ilike(companies.name, `%${q}%`)),
		);
	}
	const city = searchParams.get("city");
	if (city) {
		conditions.push(
			and(diffusibleCompanyCondition(), ilike(companies.city, `%${city}%`)),
		);
	}
	const region = searchParams.get("region");
	if (region) {
		conditions.push(
			and(
				diffusibleCompanyCondition(),
				or(eq(companies.regionCode, region), eq(companies.region, region)),
			),
		);
	}
	const department = searchParams.get("departement");
	if (department) {
		conditions.push(
			and(
				diffusibleCompanyCondition(),
				eq(companies.departmentCode, department),
			),
		);
	}
	const naf = searchParams.get("naf");
	if (naf) {
		conditions.push(
			and(diffusibleCompanyCondition(), nafSectionCondition(naf)),
		);
	}
	const year = Number(searchParams.get("year"));
	if (Number.isInteger(year) && year > 0)
		conditions.push(eq(declarations.year, year));
	const workforceMin = Number(searchParams.get("workforceMin"));
	if (Number.isFinite(workforceMin) && searchParams.has("workforceMin")) {
		conditions.push(
			sql`${gipMdsData.workforceEma}::numeric >= ${workforceMin}`,
		);
	}
	const workforceMax = Number(searchParams.get("workforceMax"));
	if (Number.isFinite(workforceMax) && searchParams.has("workforceMax")) {
		conditions.push(
			sql`${gipMdsData.workforceEma}::numeric <= ${workforceMax}`,
		);
	}
	return conditions;
}

async function fetchPublishableDeclarations(
	searchParams: URLSearchParams,
	limit?: number,
) {
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
		.innerJoin(companies, eq(declarations.siren, companies.siren))
		.innerJoin(
			campaignDeadlines,
			and(
				eq(campaignDeadlines.year, declarations.year),
				isNotNull(campaignDeadlines.publicDataReleaseDate),
				sql`${campaignDeadlines.publicDataReleaseDate} <= CURRENT_DATE`,
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
				...exportFilters(searchParams),
			),
		)
		.orderBy(declarations.year, companies.siren);
	return limit === undefined ? query : query.limit(limit);
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

function toCsvField(value: unknown): string {
	if (value === null || value === undefined) return '""';
	let str = String(value).replace(/"/g, '""');
	if (/^[=+\-@|]/.test(str)) str = `'${str}`;
	return `"${str}"`;
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
				metadata: { format: parsed.success ? parsed.data : raw },
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

			const rows = await fetchPublishableDeclarations(
				searchParams,
				format === "xlsx" ? MAX_XLSX_EXPORT_ROWS + 1 : undefined,
			);
			if (format === "xlsx" && rows.length > MAX_XLSX_EXPORT_ROWS) {
				return NextResponse.json(
					{
						error:
							"L’export Excel est limité à 10 000 lignes. Ajoutez des filtres ou utilisez le format CSV.",
					},
					{ status: 413, headers: PUBLIC_API_EXPORT_HEADERS },
				);
			}
			const data = rows.map(toPublicDTO);

			if (format === "csv") {
				const csv = formatCsv(data);
				return new NextResponse(csv, {
					headers: {
						...PUBLIC_API_EXPORT_HEADERS,
						"Content-Type": "text/csv; charset=utf-8",
						"Content-Disposition":
							'attachment; filename="index-egapro-remunerations.csv"',
					},
				});
			}
			if (format === "xlsx") {
				return new NextResponse(await formatWorkbook(data), {
					headers: {
						...PUBLIC_API_EXPORT_HEADERS,
						"Content-Type":
							"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
						"Content-Disposition":
							'attachment; filename="index-egapro-remunerations.xlsx"',
					},
				});
			}

			return NextResponse.json(
				{ data, count: data.length },
				{
					headers: PUBLIC_API_EXPORT_HEADERS,
				},
			);
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
