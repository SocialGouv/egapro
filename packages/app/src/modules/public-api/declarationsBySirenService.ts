import "server-only";

import { and, desc, eq, isNull, ne } from "drizzle-orm";
import { isYearPubliclyReleased } from "~/modules/domain";
import { db } from "~/server/db";
import {
	campaignDeadlines,
	companies,
	declarations,
	gipMdsData,
} from "~/server/db/schema";
import type {
	PublicCompanySource,
	PublicDeclarationSource,
} from "./projection";
import { toPublicDeclaration } from "./projection";
import type { PublicDeclarationDTO } from "./schemas";

type DeclarationRow = {
	declaration: PublicDeclarationSource;
	company: PublicCompanySource;
	publicDataReleaseDate: string | null;
};

async function fetchRows(
	siren: string,
	year?: number,
): Promise<DeclarationRow[]> {
	const yearFilter =
		year !== undefined ? eq(declarations.year, year) : undefined;

	const rows = await db
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
			companySiren: companies.siren,
			companyName: companies.name,
			companyAddress: companies.address,
			companyRegion: companies.region,
			companyDepartmentCode: companies.departmentCode,
			companyDepartmentLabel: companies.departmentLabel,
			companyNafCode: companies.nafCode,
			companyNafLabel: companies.nafLabel,
			workforceEma: gipMdsData.workforceEma,
			publicDataReleaseDate: campaignDeadlines.publicDataReleaseDate,
		})
		.from(declarations)
		.innerJoin(companies, eq(declarations.siren, companies.siren))
		.leftJoin(
			gipMdsData,
			and(
				eq(gipMdsData.siren, declarations.siren),
				eq(gipMdsData.year, declarations.year),
			),
		)
		.leftJoin(campaignDeadlines, eq(campaignDeadlines.year, declarations.year))
		.where(
			and(
				eq(declarations.siren, siren),
				isNull(declarations.cancelledAt),
				ne(declarations.status, "draft"),
				yearFilter,
			),
		)
		.orderBy(desc(declarations.year));

	return rows.map((row) => ({
		declaration: {
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
		},
		company: {
			siren: row.companySiren,
			name: row.companyName,
			address: row.companyAddress ?? null,
			region: row.companyRegion ?? null,
			departmentCode: row.companyDepartmentCode ?? null,
			departmentLabel: row.companyDepartmentLabel ?? null,
			nafCode: row.companyNafCode ?? null,
			nafLabel: row.companyNafLabel ?? null,
			statutDiffusion: null,
			workforceEma: row.workforceEma ?? null,
		},
		publicDataReleaseDate: row.publicDataReleaseDate ?? null,
	}));
}

function isReleased(
	publicDataReleaseDate: string | null,
	today: Date,
): boolean {
	const releaseDate = publicDataReleaseDate
		? new Date(`${publicDataReleaseDate}T00:00:00`)
		: null;
	return isYearPubliclyReleased(releaseDate, today);
}

export async function getPublicDeclarationsBySiren(
	siren: string,
	limit?: number,
): Promise<PublicDeclarationDTO[]> {
	const rows = await fetchRows(siren);
	const today = new Date();

	const released = rows.filter((r) =>
		isReleased(r.publicDataReleaseDate, today),
	);
	const limited = limit !== undefined ? released.slice(0, limit) : released;
	return limited.map((r) => toPublicDeclaration(r.declaration, r.company));
}

export async function getPublicDeclarationBySirenYear(
	siren: string,
	year: number,
): Promise<PublicDeclarationDTO | null> {
	const rows = await fetchRows(siren, year);
	const row = rows[0];
	if (!row) return null;

	const today = new Date();
	if (!isReleased(row.publicDataReleaseDate, today)) return null;

	return toPublicDeclaration(row.declaration, row.company);
}
