import { and, between, eq, gte, inArray, type SQL, sql } from "drizzle-orm";

import {
	getCampaignProgressionSchema,
	getStepDurationsSchema,
} from "~/modules/admin/stats/schemas";
import type {
	CampaignProgressionPoint,
	CampaignProgressionSeries,
	StepDurationRow,
} from "~/modules/admin/stats/types";
import {
	COMPANY_SIZE_RANGES,
	DECLARATION_STEPS,
	getStepLabel,
} from "~/modules/domain";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import {
	companies,
	declarationStatusHistory,
	declarations,
} from "~/server/db/schema";

/** Minimum number of completed transitions before showing a median / p90. */
const STEP_DURATION_MIN_SAMPLE = 5;

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

	/**
	 * Returns the median and p90 number of days declarations spend on each step
	 * of the A–F stepper, scoped to one campaign year and optionally to a
	 * workforce bucket. Feeds the K4 « délai moyen par étape » chart + table.
	 *
	 * Durations are computed as `LEAD(changed_at) - changed_at` over the
	 * `step_change` events ordered by time per declaration. Rows where there
	 * is no next event (declaration still on that step) are excluded from the
	 * percentile aggregation but still count in `sampleSize`. The percentiles
	 * are null when fewer than `STEP_DURATION_MIN_SAMPLE` declarations have
	 * actually exited the step (avoids surfacing meaningless numbers).
	 */
	getStepDurations: adminProcedure
		.input(getStepDurationsSchema)
		.query(async ({ ctx, input }): Promise<StepDurationRow[]> => {
			const sizeFilterSql = (() => {
				if (!input.sizeRange) return sql`TRUE`;
				const { min, max } = COMPANY_SIZE_RANGES[input.sizeRange];
				return max === null
					? sql`${companies.workforce} >= ${min}`
					: sql`${companies.workforce} BETWEEN ${min} AND ${max}`;
			})();

			const rows = await ctx.db.execute<{
				step: number;
				sample_size: number | string;
				completed_sample_size: number | string;
				median_days: number | string | null;
				p90_days: number | string | null;
			}>(sql`
				WITH events AS (
					SELECT
						${declarationStatusHistory.declarationId} AS declaration_id,
						${declarationStatusHistory.round} AS step,
						${declarationStatusHistory.createdAt} AS changed_at,
						LEAD(${declarationStatusHistory.createdAt}) OVER (
							PARTITION BY ${declarationStatusHistory.declarationId}
							ORDER BY ${declarationStatusHistory.createdAt}
						) AS next_changed_at
					FROM ${declarationStatusHistory}
					INNER JOIN ${declarations}
						ON ${declarations.id} = ${declarationStatusHistory.declarationId}
					INNER JOIN ${companies}
						ON ${companies.siren} = ${declarations.siren}
					WHERE ${declarationStatusHistory.eventType} = 'step_change'
						AND ${declarations.year} = ${input.year}
						AND ${sizeFilterSql}
				)
				SELECT
					step,
					COUNT(*)::int AS sample_size,
					COUNT(next_changed_at)::int AS completed_sample_size,
					percentile_cont(0.5) WITHIN GROUP (
						ORDER BY EXTRACT(EPOCH FROM (next_changed_at - changed_at)) / 86400.0
					) FILTER (WHERE next_changed_at IS NOT NULL) AS median_days,
					percentile_cont(0.9) WITHIN GROUP (
						ORDER BY EXTRACT(EPOCH FROM (next_changed_at - changed_at)) / 86400.0
					) FILTER (WHERE next_changed_at IS NOT NULL) AS p90_days
				FROM events
				WHERE step IS NOT NULL
				GROUP BY step
				ORDER BY step
			`);

			const byStep = new Map<number, StepDurationRow>();
			for (const raw of rows as unknown as Array<{
				step: number | string;
				sample_size: number | string;
				completed_sample_size: number | string;
				median_days: number | string | null;
				p90_days: number | string | null;
			}>) {
				const step = Number(raw.step);
				const sampleSize = Number(raw.sample_size);
				const completedSampleSize = Number(raw.completed_sample_size);
				const showPercentiles = completedSampleSize >= STEP_DURATION_MIN_SAMPLE;
				byStep.set(step, {
					step,
					label: getStepLabel(step),
					sampleSize,
					completedSampleSize,
					medianDays:
						showPercentiles && raw.median_days !== null
							? Number(raw.median_days)
							: null,
					p90Days:
						showPercentiles && raw.p90_days !== null
							? Number(raw.p90_days)
							: null,
				});
			}

			return DECLARATION_STEPS.map(
				({ step }) =>
					byStep.get(step) ?? {
						step,
						label: getStepLabel(step),
						sampleSize: 0,
						completedSampleSize: 0,
						medianDays: null,
						p90Days: null,
					},
			);
		}),
});
