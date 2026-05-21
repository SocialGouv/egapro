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
	POST_SUBMIT_MILESTONES,
	type PostSubmitMilestoneKey,
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

type AggregatedMilestone = {
	sample_size: number | string;
	completed_sample_size: number | string;
	median_days: number | string | null;
	p90_days: number | string | null;
};

function buildPostSubmitRow(
	key: PostSubmitMilestoneKey,
	label: string,
	raw: AggregatedMilestone | undefined,
): StepDurationRow {
	const sampleSize = raw ? Number(raw.sample_size) : 0;
	const completedSampleSize = raw ? Number(raw.completed_sample_size) : 0;
	const showPercentiles = completedSampleSize >= STEP_DURATION_MIN_SAMPLE;
	return {
		key,
		phase: "post_submit",
		step: null,
		label,
		sampleSize,
		completedSampleSize,
		medianDays:
			showPercentiles &&
			raw?.median_days !== null &&
			raw?.median_days !== undefined
				? Number(raw.median_days)
				: null,
		p90Days:
			showPercentiles && raw?.p90_days !== null && raw?.p90_days !== undefined
				? Number(raw.p90_days)
				: null,
	};
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
	 * Returns the median and p90 duration (days) declarations spend on each
	 * phase of the post-DSN journey, scoped to one campaign year and optionally
	 * to a workforce bucket. Feeds the K4 « délai moyen par étape » chart +
	 * table.
	 *
	 * Two phases:
	 * - **wizard** (steps 0..6) — durations are `LEAD(changed_at) - changed_at`
	 *   over the `step_change` events ordered by time per declaration. Rows
	 *   where there is no next event (declaration still on that step) are
	 *   excluded from the percentile aggregation but still count in
	 *   `sampleSize`.
	 * - **post_submit** (6 milestones) — durations between business events
	 *   (`submit`, `path_choice`, `second_declaration_submit`,
	 *   `joint_evaluation_submit`, `cse_opinion_submit`, `demarche_complete`),
	 *   computed per milestone via a dedicated CTE.
	 *
	 * Percentiles are null when fewer than `STEP_DURATION_MIN_SAMPLE`
	 * declarations have actually exited the step / milestone, to avoid
	 * surfacing meaningless numbers.
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

			const wizardRowsRaw = await ctx.db.execute<{
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
						AND ${declarations.cancelledAt} IS NULL
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

			const wizardByStep = new Map<number, StepDurationRow>();
			for (const raw of wizardRowsRaw as unknown as Array<{
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
				wizardByStep.set(step, {
					key: `step_${step}`,
					phase: "wizard",
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

			const wizardRows = DECLARATION_STEPS.map(
				({ step }) =>
					wizardByStep.get(step) ?? {
						key: `step_${step}`,
						phase: "wizard" as const,
						step,
						label: getStepLabel(step),
						sampleSize: 0,
						completedSampleSize: 0,
						medianDays: null,
						p90Days: null,
					},
			);

			const postSubmitAggregates: Record<
				PostSubmitMilestoneKey,
				AggregatedMilestone | undefined
			> = {
				submit_to_path_choice: undefined,
				path_choice_to_second_declaration: undefined,
				path_choice_to_joint_evaluation: undefined,
				revision_choice_to_action: undefined,
				action_to_cse_opinion: undefined,
				last_action_to_complete: undefined,
			};

			// `step_change round=6` (recap) is preferred over the legacy `submit`
			// event so we stay consistent with the wizard CTE and avoid double-
			// counting declarations where both rows coexist.
			const submitToPathChoiceRows =
				await ctx.db.execute<AggregatedMilestone>(sql`
				WITH paired AS (
					SELECT
						s.declaration_id,
						MAX(s.created_at) FILTER (WHERE s.event_type = 'step_change' AND s.round = 6) AS start_at,
						MAX(s.created_at) FILTER (WHERE s.event_type = 'path_choice' AND s.round = 1) AS end_at
					FROM ${declarationStatusHistory} s
					INNER JOIN ${declarations}
						ON ${declarations.id} = s.declaration_id
					INNER JOIN ${companies}
						ON ${companies.siren} = ${declarations.siren}
					WHERE ${declarations.year} = ${input.year}
						AND ${declarations.cancelledAt} IS NULL
						AND ${sizeFilterSql}
					GROUP BY s.declaration_id
					HAVING MAX(s.created_at) FILTER (WHERE s.event_type = 'path_choice' AND s.round = 1) IS NOT NULL
				)
				SELECT
					COUNT(*)::int AS sample_size,
					COUNT(*) FILTER (WHERE start_at IS NOT NULL AND end_at > start_at)::int AS completed_sample_size,
					percentile_cont(0.5) WITHIN GROUP (
						ORDER BY EXTRACT(EPOCH FROM (end_at - start_at)) / 86400.0
					) FILTER (WHERE start_at IS NOT NULL AND end_at > start_at) AS median_days,
					percentile_cont(0.9) WITHIN GROUP (
						ORDER BY EXTRACT(EPOCH FROM (end_at - start_at)) / 86400.0
					) FILTER (WHERE start_at IS NOT NULL AND end_at > start_at) AS p90_days
				FROM paired
			`);
			postSubmitAggregates.submit_to_path_choice = (
				submitToPathChoiceRows as unknown as AggregatedMilestone[]
			)[0];

			const pathChoiceToSecondDeclarationRows =
				await ctx.db.execute<AggregatedMilestone>(sql`
				WITH paired AS (
					SELECT
						s.declaration_id,
						MAX(s.created_at) FILTER (WHERE s.event_type = 'path_choice' AND s.round = 1) AS start_at,
						MIN(s.created_at) FILTER (WHERE s.event_type = 'second_declaration_submit') AS end_at
					FROM ${declarationStatusHistory} s
					INNER JOIN ${declarations}
						ON ${declarations.id} = s.declaration_id
					INNER JOIN ${companies}
						ON ${companies.siren} = ${declarations.siren}
					WHERE ${declarations.year} = ${input.year}
						AND ${declarations.cancelledAt} IS NULL
						AND ${sizeFilterSql}
					GROUP BY s.declaration_id
					HAVING MAX(s.created_at) FILTER (WHERE s.event_type = 'path_choice' AND s.round = 1) IS NOT NULL
				)
				SELECT
					COUNT(*) FILTER (WHERE end_at IS NOT NULL)::int AS sample_size,
					COUNT(*) FILTER (WHERE end_at IS NOT NULL AND end_at > start_at)::int AS completed_sample_size,
					percentile_cont(0.5) WITHIN GROUP (
						ORDER BY EXTRACT(EPOCH FROM (end_at - start_at)) / 86400.0
					) FILTER (WHERE end_at IS NOT NULL AND end_at > start_at) AS median_days,
					percentile_cont(0.9) WITHIN GROUP (
						ORDER BY EXTRACT(EPOCH FROM (end_at - start_at)) / 86400.0
					) FILTER (WHERE end_at IS NOT NULL AND end_at > start_at) AS p90_days
				FROM paired
			`);
			postSubmitAggregates.path_choice_to_second_declaration = (
				pathChoiceToSecondDeclarationRows as unknown as AggregatedMilestone[]
			)[0];

			// `joint_evaluation_submit round=1` = joint evaluation as the
			// first-wave corrective path (round=2 covers the revision wave and
			// is captured by `revision_choice_to_action`).
			const pathChoiceToJointEvaluationRows =
				await ctx.db.execute<AggregatedMilestone>(sql`
				WITH paired AS (
					SELECT
						s.declaration_id,
						MAX(s.created_at) FILTER (WHERE s.event_type = 'path_choice' AND s.round = 1) AS start_at,
						MIN(s.created_at) FILTER (WHERE s.event_type = 'joint_evaluation_submit' AND s.round = 1) AS end_at
					FROM ${declarationStatusHistory} s
					INNER JOIN ${declarations}
						ON ${declarations.id} = s.declaration_id
					INNER JOIN ${companies}
						ON ${companies.siren} = ${declarations.siren}
					WHERE ${declarations.year} = ${input.year}
						AND ${declarations.cancelledAt} IS NULL
						AND ${sizeFilterSql}
					GROUP BY s.declaration_id
					HAVING MAX(s.created_at) FILTER (WHERE s.event_type = 'path_choice' AND s.round = 1) IS NOT NULL
				)
				SELECT
					COUNT(*) FILTER (WHERE end_at IS NOT NULL)::int AS sample_size,
					COUNT(*) FILTER (WHERE end_at IS NOT NULL AND end_at > start_at)::int AS completed_sample_size,
					percentile_cont(0.5) WITHIN GROUP (
						ORDER BY EXTRACT(EPOCH FROM (end_at - start_at)) / 86400.0
					) FILTER (WHERE end_at IS NOT NULL AND end_at > start_at) AS median_days,
					percentile_cont(0.9) WITHIN GROUP (
						ORDER BY EXTRACT(EPOCH FROM (end_at - start_at)) / 86400.0
					) FILTER (WHERE end_at IS NOT NULL AND end_at > start_at) AS p90_days
				FROM paired
			`);
			postSubmitAggregates.path_choice_to_joint_evaluation = (
				pathChoiceToJointEvaluationRows as unknown as AggregatedMilestone[]
			)[0];

			const revisionChoiceToActionRows =
				await ctx.db.execute<AggregatedMilestone>(sql`
				WITH paired AS (
					SELECT
						s.declaration_id,
						MAX(s.created_at) FILTER (WHERE s.event_type = 'path_choice' AND s.round = 2) AS start_at,
						MAX(s.created_at) FILTER (WHERE s.event_type = 'joint_evaluation_submit' AND s.round = 2) AS end_at
					FROM ${declarationStatusHistory} s
					INNER JOIN ${declarations}
						ON ${declarations.id} = s.declaration_id
					INNER JOIN ${companies}
						ON ${companies.siren} = ${declarations.siren}
					WHERE ${declarations.year} = ${input.year}
						AND ${declarations.cancelledAt} IS NULL
						AND ${sizeFilterSql}
					GROUP BY s.declaration_id
					HAVING MAX(s.created_at) FILTER (WHERE s.event_type = 'path_choice' AND s.round = 2) IS NOT NULL
				)
				SELECT
					COUNT(*)::int AS sample_size,
					COUNT(*) FILTER (WHERE end_at IS NOT NULL AND end_at > start_at)::int AS completed_sample_size,
					percentile_cont(0.5) WITHIN GROUP (
						ORDER BY EXTRACT(EPOCH FROM (end_at - start_at)) / 86400.0
					) FILTER (WHERE end_at IS NOT NULL AND end_at > start_at) AS median_days,
					percentile_cont(0.9) WITHIN GROUP (
						ORDER BY EXTRACT(EPOCH FROM (end_at - start_at)) / 86400.0
					) FILTER (WHERE end_at IS NOT NULL AND end_at > start_at) AS p90_days
				FROM paired
			`);
			postSubmitAggregates.revision_choice_to_action = (
				revisionChoiceToActionRows as unknown as AggregatedMilestone[]
			)[0];

			// CSE opinion only applies to >= 100 employees. The preceding action
			// is either the second declaration or joint evaluation, both grouped
			// under a single `last_action_at` aggregate.
			const actionToCseOpinionRows =
				await ctx.db.execute<AggregatedMilestone>(sql`
				WITH ranked AS (
					SELECT
						s.declaration_id,
						MAX(s.created_at) FILTER (WHERE s.event_type = 'cse_opinion_submit') AS cse_at,
						MAX(s.created_at) FILTER (
							WHERE s.event_type IN ('second_declaration_submit', 'joint_evaluation_submit')
						) AS last_action_at
					FROM ${declarationStatusHistory} s
					INNER JOIN ${declarations}
						ON ${declarations.id} = s.declaration_id
					INNER JOIN ${companies}
						ON ${companies.siren} = ${declarations.siren}
					WHERE ${declarations.year} = ${input.year}
						AND ${declarations.cancelledAt} IS NULL
						AND ${sizeFilterSql}
					GROUP BY s.declaration_id
				),
				paired AS (
					SELECT
						declaration_id,
						last_action_at AS start_at,
						cse_at AS end_at
					FROM ranked
					WHERE cse_at IS NOT NULL
				)
				SELECT
					COUNT(*)::int AS sample_size,
					COUNT(*) FILTER (WHERE start_at IS NOT NULL AND end_at > start_at)::int AS completed_sample_size,
					percentile_cont(0.5) WITHIN GROUP (
						ORDER BY EXTRACT(EPOCH FROM (end_at - start_at)) / 86400.0
					) FILTER (WHERE start_at IS NOT NULL AND end_at > start_at) AS median_days,
					percentile_cont(0.9) WITHIN GROUP (
						ORDER BY EXTRACT(EPOCH FROM (end_at - start_at)) / 86400.0
					) FILTER (WHERE start_at IS NOT NULL AND end_at > start_at) AS p90_days
				FROM paired
			`);
			postSubmitAggregates.action_to_cse_opinion = (
				actionToCseOpinionRows as unknown as AggregatedMilestone[]
			)[0];

			// `created_at < complete_at` filter is load-bearing: a CSE opinion
			// can fire AFTER the completion (correction edge case) and would
			// otherwise yield a negative duration.
			const lastActionToCompleteRows =
				await ctx.db.execute<AggregatedMilestone>(sql`
				WITH complete_ts AS (
					SELECT
						s.declaration_id,
						MAX(s.created_at) AS complete_at
					FROM ${declarationStatusHistory} s
					INNER JOIN ${declarations}
						ON ${declarations.id} = s.declaration_id
					INNER JOIN ${companies}
						ON ${companies.siren} = ${declarations.siren}
					WHERE s.event_type = 'demarche_complete'
						AND ${declarations.year} = ${input.year}
						AND ${declarations.cancelledAt} IS NULL
						AND ${sizeFilterSql}
					GROUP BY s.declaration_id
				),
				paired AS (
					SELECT
						ct.declaration_id,
						MAX(s.created_at) FILTER (
							WHERE s.event_type IN (
								'cse_opinion_submit',
								'second_declaration_submit',
								'joint_evaluation_submit'
							)
							AND s.created_at < ct.complete_at
						) AS start_at,
						ct.complete_at AS end_at
					FROM complete_ts ct
					LEFT JOIN ${declarationStatusHistory} s
						ON s.declaration_id = ct.declaration_id
					GROUP BY ct.declaration_id, ct.complete_at
				)
				SELECT
					COUNT(*)::int AS sample_size,
					COUNT(*) FILTER (WHERE start_at IS NOT NULL AND end_at > start_at)::int AS completed_sample_size,
					percentile_cont(0.5) WITHIN GROUP (
						ORDER BY EXTRACT(EPOCH FROM (end_at - start_at)) / 86400.0
					) FILTER (WHERE start_at IS NOT NULL AND end_at > start_at) AS median_days,
					percentile_cont(0.9) WITHIN GROUP (
						ORDER BY EXTRACT(EPOCH FROM (end_at - start_at)) / 86400.0
					) FILTER (WHERE start_at IS NOT NULL AND end_at > start_at) AS p90_days
				FROM paired
			`);
			postSubmitAggregates.last_action_to_complete = (
				lastActionToCompleteRows as unknown as AggregatedMilestone[]
			)[0];

			const postSubmitRows = POST_SUBMIT_MILESTONES.map(({ key, label }) =>
				buildPostSubmitRow(key, label, postSubmitAggregates[key]),
			);

			return [...wizardRows, ...postSubmitRows];
		}),
});
