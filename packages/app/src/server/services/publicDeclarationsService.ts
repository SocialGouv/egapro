import "server-only";

import {
	and,
	count,
	eq,
	ilike,
	isNotNull,
	isNull,
	ne,
	or,
	sql,
} from "drizzle-orm";

import {
	type PublicSearchInput,
	type PublicSearchResultDTO,
	toPublicDeclaration,
} from "~/modules/public-api";
import { db } from "~/server/db";
import {
	campaignDeadlines,
	companies,
	declarations,
	gipMdsData,
} from "~/server/db/schema";

export async function searchPublicDeclarations(
	input: PublicSearchInput,
): Promise<PublicSearchResultDTO> {
	const baseConditions = [
		isNull(declarations.cancelledAt),
		ne(declarations.status, "draft"),
		isNotNull(campaignDeadlines.publicDataReleaseDate),
		sql`${campaignDeadlines.publicDataReleaseDate} <= CURRENT_DATE`,
	];

	if (input.q) {
		const term = `%${input.q}%`;
		const queryFilter = or(
			ilike(companies.name, term),
			ilike(declarations.siren, term),
		);
		if (queryFilter) baseConditions.push(queryFilter);
	}

	if (input.region) {
		baseConditions.push(eq(companies.region, input.region));
	}

	if (input.departement) {
		baseConditions.push(eq(companies.departmentCode, input.departement));
	}

	if (input.naf) {
		baseConditions.push(eq(companies.nafCode, input.naf));
	}

	if (input.year) {
		baseConditions.push(eq(declarations.year, input.year));
	}

	const where = and(...baseConditions);

	const [rows, countResult] = await Promise.all([
		db
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
				workforceEma: gipMdsData.workforceEma,
			})
			.from(declarations)
			.innerJoin(companies, eq(declarations.siren, companies.siren))
			.innerJoin(
				campaignDeadlines,
				eq(declarations.year, campaignDeadlines.year),
			)
			.leftJoin(
				gipMdsData,
				and(
					eq(declarations.siren, gipMdsData.siren),
					eq(declarations.year, gipMdsData.year),
				),
			)
			.where(where)
			.limit(input.limit)
			.offset(input.offset),
		db
			.select({ total: count() })
			.from(declarations)
			.innerJoin(companies, eq(declarations.siren, companies.siren))
			.innerJoin(
				campaignDeadlines,
				eq(declarations.year, campaignDeadlines.year),
			)
			.where(where),
	]);

	const data = rows.map((row) =>
		toPublicDeclaration(
			{
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
			{
				siren: row.siren,
				name: row.name,
				address: row.address ?? null,
				region: row.region ?? null,
				departmentCode: row.departmentCode ?? null,
				departmentLabel: row.departmentLabel ?? null,
				nafCode: row.nafCode ?? null,
				nafLabel: row.nafLabel ?? null,
				statutDiffusion: null,
				workforceEma: row.workforceEma ?? null,
			},
		),
	);

	return {
		data,
		count: countResult[0]?.total ?? 0,
	};
}
