import { and, between, eq, gte, inArray, type SQL, sql } from "drizzle-orm";

import {
	getCampaignProgressionSchema,
	getCampaignStatsSchema,
} from "~/modules/admin/stats/schemas";
import type {
	CampaignProgressionPoint,
	CampaignProgressionSeries,
	CampaignStats,
} from "~/modules/admin/stats/types";
import {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_RANGES,
	COMPANY_SIZE_VOLUNTARY_MAX,
	type CompanySizeRange,
	isTriennialYear,
} from "~/modules/domain";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import {
	companies,
	declarationStatusHistory,
	declarations,
	gipMdsData,
} from "~/server/db/schema";

type AggregatedRow = { day: string; year: number; count: number };

/**
 * Walk the per-day rows (already ordered by (year, day) ASC) and produce one
 * series per year with running cumulative totals. Days without any submission
 * are NOT padded — the chart connects consecutive points as a line, which
 * visually represents a flat segment on zero-submission days.
 */
function buildSeries(rows: AggregatedRow[]): CampaignProgressionSeries[] {
	const byYear = new Map<number, CampaignProgressionPoint[]>();

	for (const row of rows) {
		const year = row.year;
		const list = byYear.get(year) ?? [];
		const previous = list[list.length - 1]?.cumulative ?? 0;
		list.push({
			day: row.day,
			cumulative: previous + row.count,
		});
		byYear.set(year, list);
	}

	return Array.from(byYear.entries())
		.sort(([a], [b]) => a - b)
		.map(([year, points]) => ({ year, points }));
}

// Mirrors `isObligatedForYear` (domain) as a SQL predicate so the workforce
// bracket is enforced server-side and stays symmetric between numerator and denominator.
function obligationWorkforceFilter(
	year: number,
	sizeRange: CompanySizeRange | undefined,
): SQL {
	const ema = sql<number>`floor(${gipMdsData.workforceEma})`;
	const triennialActive = isTriennialYear(year);
	const triennialClause = triennialActive
		? sql`${ema} >= ${COMPANY_SIZE_VOLUNTARY_MAX} AND ${ema} < ${COMPANY_SIZE_ANNUAL_MIN}`
		: sql`false`;
	const annualClause = sql`${ema} >= ${COMPANY_SIZE_ANNUAL_MIN}`;
	const baseObligation = sql`((${triennialClause}) OR (${annualClause}))`;

	if (!sizeRange) return baseObligation;

	const { min, max } = COMPANY_SIZE_RANGES[sizeRange];
	const bucket =
		max === null
			? sql`${ema} >= ${min}`
			: sql`${ema} BETWEEN ${min} AND ${max}`;
	return sql`(${bucket}) AND ${baseObligation}`;
}

function roundOneDecimal(value: number): number {
	return Math.round(value * 10) / 10;
}

function computeRate(submitted: number, obligated: number): number {
	if (obligated === 0) return 0;
	return roundOneDecimal((submitted / obligated) * 100);
}

/**
 * Admin statistics router — read-only aggregations for the DGT dashboard.
 *
 * All procedures expose sensitive submission data (PII-adjacent when filtered
 * narrowly enough) and are therefore audited with category `read_sensitive`.
 */
export const adminStatsRouter = createTRPCRouter({
	/**
	 * Returns the cumulative submission curve per campaign year, optionally
	 * scoped to a workforce bucket. Feeds the K2 progression chart.
	 */
	getCampaignProgression: adminProcedure
		.input(getCampaignProgressionSchema)
		.query(async ({ ctx, input }): Promise<CampaignProgressionSeries[]> => {
			const filters: SQL[] = [
				eq(declarationStatusHistory.eventType, "submit"),
				inArray(declarations.year, input.years),
			];

			if (input.sizeRange) {
				const { min, max } = COMPANY_SIZE_RANGES[input.sizeRange];
				filters.push(
					max === null
						? gte(companies.workforce, min)
						: between(companies.workforce, min, max),
				);
			}

			const dayExpr = sql<string>`to_char(${declarationStatusHistory.createdAt}, 'YYYY-MM-DD')`;

			const query = ctx.db
				.select({
					day: dayExpr,
					year: declarations.year,
					count: sql<number>`count(*)::int`,
				})
				.from(declarationStatusHistory)
				.innerJoin(
					declarations,
					eq(declarationStatusHistory.declarationId, declarations.id),
				);

			const scoped = input.sizeRange
				? query.innerJoin(companies, eq(declarations.siren, companies.siren))
				: query;

			const rows = await scoped
				.where(and(...filters))
				.groupBy(dayExpr, declarations.year)
				.orderBy(declarations.year, dayExpr);

			return buildSeries(rows as AggregatedRow[]);
		}),

	getCampaignStats: adminProcedure
		.input(getCampaignStatsSchema)
		.query(async ({ ctx, input }): Promise<CampaignStats> => {
			const previousYear = input.year - 1;

			const obligatedQuery = (year: number) =>
				ctx.db
					.select({ value: sql<number>`count(*)::int` })
					.from(gipMdsData)
					.where(
						and(
							eq(gipMdsData.year, year),
							obligationWorkforceFilter(year, input.sizeRange),
						),
					);

			const submittedQuery = (year: number) =>
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
							eq(declarations.year, year),
							eq(declarations.status, "demarche_completed"),
							obligationWorkforceFilter(year, input.sizeRange),
						),
					);

			const [
				obligatedRows,
				submittedRows,
				previousObligatedRows,
				previousSubmittedRows,
			] = await Promise.all([
				obligatedQuery(input.year),
				submittedQuery(input.year),
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
			};
		}),
});
