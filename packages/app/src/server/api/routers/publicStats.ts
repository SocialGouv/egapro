import { and, eq, type SQL, sql } from "drizzle-orm";

import {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_VOLUNTARY_MAX,
	getCurrentYear,
	isTriennialYear,
} from "~/modules/domain";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { declarations, gipMdsData } from "~/server/db/schema";

type CurrentCampaignRate = {
	totalObligated: number;
	totalSubmitted: number;
	submissionRate: number;
	previousYearRate: number | null;
	year: number;
};

function buildObligationFilter(year: number): SQL {
	const ema = sql<number>`floor(${gipMdsData.workforceEma})`;
	const triennialClause = isTriennialYear(year)
		? sql`${ema} >= ${COMPANY_SIZE_VOLUNTARY_MAX} AND ${ema} < ${COMPANY_SIZE_ANNUAL_MIN}`
		: sql`false`;
	const annualClause = sql`${ema} >= ${COMPANY_SIZE_ANNUAL_MIN}`;
	return sql`((${triennialClause}) OR (${annualClause}))`;
}

function roundOneDecimal(value: number): number {
	return Math.round(value * 10) / 10;
}

function computeRate(submitted: number, obligated: number): number {
	if (obligated === 0) return 0;
	return roundOneDecimal((submitted / obligated) * 100);
}

export const publicStatsRouter = createTRPCRouter({
	getCurrentCampaignRate: publicProcedure.query(
		async ({ ctx }): Promise<CurrentCampaignRate> => {
			const year = getCurrentYear();
			const previousYear = year - 1;

			const obligatedQuery = (targetYear: number) =>
				ctx.db
					.select({ value: sql<number>`count(*)::int` })
					.from(gipMdsData)
					.where(
						and(
							eq(gipMdsData.year, targetYear),
							buildObligationFilter(targetYear),
						),
					);

			const submittedQuery = (targetYear: number) =>
				ctx.db
					.select({ value: sql<number>`count(*)::int` })
					.from(declarations)
					.innerJoin(
						gipMdsData,
						and(
							eq(declarations.siren, gipMdsData.siren),
							eq(declarations.year, gipMdsData.year),
						) as SQL,
					)
					.where(
						and(
							eq(declarations.year, targetYear),
							eq(declarations.status, "demarche_completed"),
							buildObligationFilter(targetYear),
						),
					);

			const [
				obligatedRows,
				submittedRows,
				previousObligatedRows,
				previousSubmittedRows,
			] = await Promise.all([
				obligatedQuery(year),
				submittedQuery(year),
				obligatedQuery(previousYear),
				submittedQuery(previousYear),
			]);

			const totalObligated = obligatedRows[0]?.value ?? 0;
			const totalSubmitted = submittedRows[0]?.value ?? 0;
			const previousObligated = previousObligatedRows[0]?.value ?? 0;
			const previousSubmitted = previousSubmittedRows[0]?.value ?? 0;

			const submissionRate = computeRate(totalSubmitted, totalObligated);
			const previousYearRate =
				previousObligated === 0
					? null
					: computeRate(previousSubmitted, previousObligated);

			return {
				totalObligated,
				totalSubmitted,
				submissionRate,
				previousYearRate,
				year,
			};
		},
	),
});
