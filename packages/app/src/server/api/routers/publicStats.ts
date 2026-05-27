import { and, eq, type SQL, sql } from "drizzle-orm";

import {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_VOLUNTARY_MAX,
	computeRate,
	getCurrentYear,
	isTriennialYear,
	roundOneDecimal,
	SCORE_BRACKETS,
	type ScoreBracketId,
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

type ScoreDistributionBracket = {
	id: ScoreBracketId;
	label: string;
	count: number;
	percentage: number;
};

type ScoreDistribution = {
	brackets: ScoreDistributionBracket[];
	total: number;
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

	getScoreDistribution: publicProcedure.query(
		async ({ ctx }): Promise<ScoreDistribution> => {
			const year = getCurrentYear();

			const globalScore = sql<
				number | null
			>`(${declarations.remunerationScore} + ${declarations.quartileScore} + ${declarations.categoryScore})`;

			const bucketExpr = sql<ScoreBracketId>`CASE
					WHEN ${globalScore} IS NULL THEN 'nc'
					WHEN ${globalScore} < 50 THEN 'lt50'
					WHEN ${globalScore} < 60 THEN '50-59'
					WHEN ${globalScore} < 70 THEN '60-69'
					WHEN ${globalScore} < 80 THEN '70-79'
					WHEN ${globalScore} < 90 THEN '80-89'
					WHEN ${globalScore} < 100 THEN '90-99'
					ELSE '100'
				END`;

			const rows = await ctx.db
				.select({
					bucket: bucketExpr,
					count: sql<number>`count(*)::int`,
				})
				.from(declarations)
				.where(
					and(
						eq(declarations.year, year),
						eq(declarations.status, "demarche_completed"),
					),
				)
				.groupBy(bucketExpr);

			const counts = new Map<ScoreBracketId, number>();
			for (const row of rows) {
				counts.set(row.bucket, row.count);
			}

			const total = Array.from(counts.values()).reduce((sum, c) => sum + c, 0);

			const brackets: ScoreDistributionBracket[] = SCORE_BRACKETS.map(
				(bracket) => {
					const count = counts.get(bracket.id) ?? 0;
					const percentage =
						total === 0 ? 0 : roundOneDecimal((count / total) * 100);
					return {
						id: bracket.id,
						label: bracket.label,
						count,
						percentage,
					};
				},
			);

			return { brackets, total, year };
		},
	),
});
