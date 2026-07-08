import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { AUDIT_ACTIONS } from "~/modules/audit";
import type {
	PublicCompanySource,
	PublicDeclarationDTO,
} from "~/modules/public-api";
import {
	publicDeclarationColumns,
	toPublicDeclaration,
} from "~/modules/public-api";
import { withAuditedRoute } from "~/server/audit/withAuditedRoute";
import { db } from "~/server/db";
import {
	campaignDeadlines,
	companies,
	declarations,
	gipMdsData,
} from "~/server/db/schema";

async function fetchPublishableDeclarations() {
	return db
		.select({
			...publicDeclarationColumns,
			siren: companies.siren,
			name: companies.name,
			address: companies.address,
			region: companies.region,
			departmentCode: companies.departmentCode,
			departmentLabel: companies.departmentLabel,
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
			),
		)
		.orderBy(declarations.year, companies.siren);
}

type ExportRow = Awaited<
	ReturnType<typeof fetchPublishableDeclarations>
>[number];

function toPublicDTO(row: ExportRow): PublicDeclarationDTO {
	const companySource: PublicCompanySource = {
		siren: row.siren,
		name: row.name,
		address: row.address,
		region: row.region,
		departmentCode: row.departmentCode,
		departmentLabel: row.departmentLabel,
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
	"region",
	"departmentCode",
	"departmentLabel",
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

const FORMAT_SCHEMA = z.enum(["json", "csv"]).default("json");

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
			const { searchParams } = new URL(request.url);
			const formatResult = FORMAT_SCHEMA.safeParse(
				searchParams.get("format") ?? "json",
			);
			if (!formatResult.success) {
				return NextResponse.json(
					{ error: "Le paramètre format doit être 'json' ou 'csv'" },
					{ status: 400 },
				);
			}
			const format = formatResult.data;

			const rows = await fetchPublishableDeclarations();
			const data = rows.map(toPublicDTO);

			if (format === "csv") {
				const csv = formatCsv(data);
				return new NextResponse(csv, {
					headers: {
						"Content-Type": "text/csv; charset=utf-8",
						"Content-Disposition":
							'attachment; filename="declarations_export.csv"',
						"Access-Control-Allow-Origin": "*",
						"Cache-Control": "public, max-age=3600, s-maxage=3600",
					},
				});
			}

			return NextResponse.json(
				{ data, count: data.length },
				{
					headers: {
						"Access-Control-Allow-Origin": "*",
						"Cache-Control": "public, max-age=3600, s-maxage=3600",
					},
				},
			);
		} catch (error) {
			console.error(
				"[api/public/declarations/export]",
				error instanceof Error ? error.message : "unknown error",
			);
			return NextResponse.json(
				{ error: "Erreur lors de l'export des déclarations" },
				{ status: 500 },
			);
		}
	},
);
