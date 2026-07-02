import { and, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { AUDIT_ACTIONS } from "~/modules/audit";
import type {
	PublicCompanySource,
	PublicDeclarationDTO,
	PublicDeclarationSource,
} from "~/modules/public-api";
import { toPublicDeclaration } from "~/modules/public-api";
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
			year: declarations.year,
			totalWomen: declarations.totalWomen,
			totalMen: declarations.totalMen,
			globalAnnualMeanGap: declarations.globalAnnualMeanGap,
			globalAnnualMedianGap: declarations.globalAnnualMedianGap,
			globalHourlyMeanGap: declarations.globalHourlyMeanGap,
			globalHourlyMedianGap: declarations.globalHourlyMedianGap,
			variableAnnualMeanGap: declarations.variableAnnualMeanGap,
			variableAnnualMedianGap: declarations.variableAnnualMedianGap,
			variableHourlyMeanGap: declarations.variableHourlyMeanGap,
			variableHourlyMedianGap: declarations.variableHourlyMedianGap,
			variableProportionWomen: declarations.variableProportionWomen,
			variableProportionMen: declarations.variableProportionMen,
			annualQuartile1ProportionWomen:
				declarations.annualQuartile1ProportionWomen,
			annualQuartile2ProportionWomen:
				declarations.annualQuartile2ProportionWomen,
			annualQuartile3ProportionWomen:
				declarations.annualQuartile3ProportionWomen,
			annualQuartile4ProportionWomen:
				declarations.annualQuartile4ProportionWomen,
			annualQuartile1ProportionMen: declarations.annualQuartile1ProportionMen,
			annualQuartile2ProportionMen: declarations.annualQuartile2ProportionMen,
			annualQuartile3ProportionMen: declarations.annualQuartile3ProportionMen,
			annualQuartile4ProportionMen: declarations.annualQuartile4ProportionMen,
			hourlyQuartile1ProportionWomen:
				declarations.hourlyQuartile1ProportionWomen,
			hourlyQuartile2ProportionWomen:
				declarations.hourlyQuartile2ProportionWomen,
			hourlyQuartile3ProportionWomen:
				declarations.hourlyQuartile3ProportionWomen,
			hourlyQuartile4ProportionWomen:
				declarations.hourlyQuartile4ProportionWomen,
			hourlyQuartile1ProportionMen: declarations.hourlyQuartile1ProportionMen,
			hourlyQuartile2ProportionMen: declarations.hourlyQuartile2ProportionMen,
			hourlyQuartile3ProportionMen: declarations.hourlyQuartile3ProportionMen,
			hourlyQuartile4ProportionMen: declarations.hourlyQuartile4ProportionMen,
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
	const declarationSource: PublicDeclarationSource = {
		year: row.year,
		totalWomen: row.totalWomen,
		totalMen: row.totalMen,
		globalAnnualMeanGap: row.globalAnnualMeanGap,
		globalAnnualMedianGap: row.globalAnnualMedianGap,
		globalHourlyMeanGap: row.globalHourlyMeanGap,
		globalHourlyMedianGap: row.globalHourlyMedianGap,
		variableAnnualMeanGap: row.variableAnnualMeanGap,
		variableAnnualMedianGap: row.variableAnnualMedianGap,
		variableHourlyMeanGap: row.variableHourlyMeanGap,
		variableHourlyMedianGap: row.variableHourlyMedianGap,
		variableProportionWomen: row.variableProportionWomen,
		variableProportionMen: row.variableProportionMen,
		annualQuartile1ProportionWomen: row.annualQuartile1ProportionWomen,
		annualQuartile2ProportionWomen: row.annualQuartile2ProportionWomen,
		annualQuartile3ProportionWomen: row.annualQuartile3ProportionWomen,
		annualQuartile4ProportionWomen: row.annualQuartile4ProportionWomen,
		annualQuartile1ProportionMen: row.annualQuartile1ProportionMen,
		annualQuartile2ProportionMen: row.annualQuartile2ProportionMen,
		annualQuartile3ProportionMen: row.annualQuartile3ProportionMen,
		annualQuartile4ProportionMen: row.annualQuartile4ProportionMen,
		hourlyQuartile1ProportionWomen: row.hourlyQuartile1ProportionWomen,
		hourlyQuartile2ProportionWomen: row.hourlyQuartile2ProportionWomen,
		hourlyQuartile3ProportionWomen: row.hourlyQuartile3ProportionWomen,
		hourlyQuartile4ProportionWomen: row.hourlyQuartile4ProportionWomen,
		hourlyQuartile1ProportionMen: row.hourlyQuartile1ProportionMen,
		hourlyQuartile2ProportionMen: row.hourlyQuartile2ProportionMen,
		hourlyQuartile3ProportionMen: row.hourlyQuartile3ProportionMen,
		hourlyQuartile4ProportionMen: row.hourlyQuartile4ProportionMen,
	};

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

	return toPublicDeclaration(declarationSource, companySource);
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

function toCsvField(value: unknown): string {
	if (value === null || value === undefined) return '""';
	return `"${String(value).replace(/"/g, '""')}"`;
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
			return {
				metadata: { format: url.searchParams.get("format") ?? "json" },
			};
		},
	},
	async (request) => {
		try {
			const { searchParams } = new URL(request.url);
			const format = searchParams.get("format") ?? "json";

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
