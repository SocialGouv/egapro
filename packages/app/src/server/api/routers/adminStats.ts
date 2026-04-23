import {
	and,
	between,
	eq,
	gte,
	inArray,
	isNotNull,
	like,
	type SQL,
	sql,
} from "drizzle-orm";

import type {
	CampaignProgressionPoint,
	CampaignProgressionSeries,
	GapAlertRateResult,
	MultiYearGapPoint,
	MultiYearGapTrendSeries,
} from "~/modules/admin/stats";
import {
	getCampaignProgressionSchema,
	getGapAlertRateSchema,
	getMultiYearGapTrendSchema,
} from "~/modules/admin/stats";
import { COMPANY_SIZE_RANGES } from "~/modules/domain";
import { DOMINANT_NAF_SECTIONS, OTHER_NAF_SEGMENT } from "~/modules/shared";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import type { DB } from "~/server/db";
import { companies, declarations } from "~/server/db/schema";

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
				eq(declarations.status, "submitted"),
				isNotNull(declarations.submittedAt),
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

			// `to_char` forces a text return so the postgres.js driver hands back
			// a plain ISO string (YYYY-MM-DD) rather than a `Date` that would then
			// need timezone-safe formatting.
			const dayExpr = sql<string>`to_char(${declarations.submittedAt}, 'YYYY-MM-DD')`;

			const query = ctx.db
				.select({
					day: dayExpr,
					year: declarations.year,
					count: sql<number>`count(*)::int`,
				})
				.from(declarations);

			const scoped = input.sizeRange
				? query.innerJoin(companies, eq(declarations.siren, companies.siren))
				: query;

			const rows = await scoped
				.where(and(...filters))
				.groupBy(dayExpr, declarations.year)
				.orderBy(declarations.year, dayExpr);

			return buildSeries(rows as AggregatedRow[]);
		}),

	/**
	 * K8 — "Taux d'écart ≥ 5 %". Returns the share of submitted declarations
	 * whose salary gap crosses the regulatory alert threshold for the given
	 * year, the same ratio on year-1 for the delta, and the filter sample size.
	 *
	 * A rising rate signals degradation — the UI inverts the badge colour
	 * (red on positive delta) via the `inverted` prop on `<AdminKpiTile>`.
	 */
	getGapAlertRate: adminProcedure
		.input(getGapAlertRateSchema)
		.query(async ({ ctx, input }): Promise<GapAlertRateResult> => {
			const rateFor = (year: number) =>
				computeYearRate({
					db: ctx.db,
					year,
					sizeRange: input.sizeRange,
					nafCodePrefix: input.nafCodePrefix,
				});

			const [current, previous] = await Promise.all([
				rateFor(input.year),
				rateFor(input.year - 1),
			]);

			const delta =
				current.rate === null || previous.rate === null
					? null
					: current.rate - previous.rate;

			return {
				rate: current.rate,
				previousRate: previous.rate,
				delta,
				sampleSize: current.total,
			};
		}),

	/**
	 * K10 — "Évolution annuelle des écarts". Returns one curve per segment
	 * (Global / workforce bucket / NAF section) over the requested range of
	 * campaign years. Only declarations with an exploitable `average_gap`
	 * (non-null) contribute — declarations submitted without any salary pair
	 * filled in are excluded.
	 */
	getMultiYearGapTrend: adminProcedure
		.input(getMultiYearGapTrendSchema)
		.query(async ({ ctx, input }): Promise<MultiYearGapTrendSeries[]> => {
			const filters: SQL[] = [
				eq(declarations.status, "submitted"),
				isNotNull(declarations.averageGap),
				between(declarations.year, input.yearFrom, input.yearTo),
			];

			// Segmentation-aware filter gating: a `sizeRange` filter while the
			// user asked to *segment* by workforce would collapse every bucket
			// but one — silently ignore it. Same story for `nafCodePrefix` vs.
			// "segment by NAF".
			const shouldApplySizeRange =
				input.sizeRange !== undefined && input.segmentBy !== "workforce";
			const shouldApplyNafFilter =
				input.nafCodePrefix !== undefined && input.segmentBy !== "naf";

			if (shouldApplySizeRange && input.sizeRange) {
				const { min, max } = COMPANY_SIZE_RANGES[input.sizeRange];
				filters.push(
					max === null
						? gte(companies.workforce, min)
						: between(companies.workforce, min, max),
				);
			}

			if (shouldApplyNafFilter && input.nafCodePrefix) {
				filters.push(like(companies.nafCode, `${input.nafCodePrefix}%`));
			}

			if (input.segmentBy === "naf") {
				// Excludes declarations without a NAF code so they don't end up
				// in an invisible null segment.
				filters.push(isNotNull(companies.nafCode));
			}

			const segmentExpr = buildSegmentExpression(input.segmentBy);

			const needsCompaniesJoin =
				input.segmentBy !== "global" ||
				shouldApplySizeRange ||
				shouldApplyNafFilter;

			const baseQuery = ctx.db.select({
				year: declarations.year,
				segment: segmentExpr,
				avgGap: sql<string | null>`avg(${declarations.averageGap})`,
				sampleSize: sql<number>`count(*)::int`,
			});

			const scoped = needsCompaniesJoin
				? baseQuery
						.from(declarations)
						.innerJoin(companies, eq(declarations.siren, companies.siren))
				: baseQuery.from(declarations);

			const rows = await scoped
				.where(and(...filters))
				.groupBy(declarations.year, segmentExpr)
				.orderBy(declarations.year, segmentExpr);

			return buildTrendSeries(rows);
		}),
});

function buildSegmentExpression(
	segmentBy: "global" | "workforce" | "naf",
): SQL<string> {
	if (segmentBy === "global") {
		return sql<string>`'Global'`;
	}
	if (segmentBy === "workforce") {
		// Mirrors the boundaries of `COMPANY_SIZE_RANGES`. Hard-coding the
		// buckets as literals keeps the generated SQL self-documenting; if a
		// new bucket is introduced, the constant in `domain` and this CASE
		// must be updated together.
		return sql<string>`case
			when ${companies.workforce} < 50 then '<50'
			when ${companies.workforce} < 100 then '50-99'
			when ${companies.workforce} < 150 then '100-149'
			when ${companies.workforce} < 250 then '150-249'
			else '250+'
		end`;
	}
	// NAF: collapse non-dominant sections into a single "Autres" segment.
	// Each dominant letter goes through parameter binding via `sql.join` —
	// prevents the helper from becoming an injection sink if the constant
	// is ever sourced from outside the module.
	const dominantParams = sql.join(
		DOMINANT_NAF_SECTIONS.map((code) => sql`${code}`),
		sql`, `,
	);
	return sql<string>`case
		when upper(left(${companies.nafCode}, 1)) in (${dominantParams})
		then upper(left(${companies.nafCode}, 1))
		else ${OTHER_NAF_SEGMENT}
	end`;
}

type TrendRow = {
	year: number;
	segment: string;
	avgGap: string | null;
	sampleSize: number;
};

function buildTrendSeries(rows: TrendRow[]): MultiYearGapTrendSeries[] {
	const bySegment = new Map<string, MultiYearGapPoint[]>();
	for (const row of rows) {
		const list = bySegment.get(row.segment) ?? [];
		list.push({
			year: row.year,
			avgGap:
				row.avgGap === null
					? null
					: Math.round(Number.parseFloat(row.avgGap) * 10) / 10,
			sampleSize: row.sampleSize,
		});
		bySegment.set(row.segment, list);
	}
	return Array.from(bySegment.entries()).map(([segment, points]) => ({
		segment,
		points,
	}));
}

type ComputeYearRateParams = {
	db: DB;
	year: number;
	sizeRange?: keyof typeof COMPANY_SIZE_RANGES;
	nafCodePrefix?: string;
};

/**
 * Run a single aggregation for one campaign year: total submitted count +
 * alert count. Returns a rate rounded to one decimal (0..100) or `null`
 * when nothing matches.
 */
async function computeYearRate(params: ComputeYearRateParams): Promise<{
	rate: number | null;
	total: number;
}> {
	const filters: SQL[] = [
		eq(declarations.status, "submitted"),
		eq(declarations.year, params.year),
	];

	if (params.sizeRange) {
		const { min, max } = COMPANY_SIZE_RANGES[params.sizeRange];
		filters.push(
			max === null
				? gte(companies.workforce, min)
				: between(companies.workforce, min, max),
		);
	}

	if (params.nafCodePrefix) {
		filters.push(like(companies.nafCode, `${params.nafCodePrefix}%`));
	}

	const requiresCompaniesJoin = Boolean(
		params.sizeRange || params.nafCodePrefix,
	);

	const baseQuery = params.db.select({
		total: sql<number>`count(*)::int`,
		alerts: sql<number>`count(*) filter (where ${declarations.hasAlertGap})::int`,
	});

	const scoped = requiresCompaniesJoin
		? baseQuery
				.from(declarations)
				.innerJoin(companies, eq(declarations.siren, companies.siren))
		: baseQuery.from(declarations);

	const [row] = await scoped.where(and(...filters));
	const total = row?.total ?? 0;
	const alerts = row?.alerts ?? 0;

	if (total === 0) return { rate: null, total: 0 };

	const rate = Math.round((alerts / total) * 1000) / 10;
	return { rate, total };
}
