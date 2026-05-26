import { and, between, eq, gte, inArray, type SQL, sql } from "drizzle-orm";

import {
	getCampaignProgressionSchema,
	getCampaignStatsSchema,
	getStepDropoffRateSchema,
	getStepDurationsSchema,
} from "~/modules/admin/stats/schemas";
import type {
	CampaignProgressionPoint,
	CampaignProgressionSeries,
	CampaignStats,
	StepDropoffRow,
	StepDurationRow,
} from "~/modules/admin/stats/types";
import {
	COMPANY_SIZE_ANNUAL_MIN,
	COMPANY_SIZE_RANGES,
	COMPANY_SIZE_VOLUNTARY_MAX,
	type CompanySizeRange,
	DECLARATION_STEPS,
	getStepLabel,
	isTriennialYear,
	POST_SUBMIT_DROPOFF_PHASES,
	POST_SUBMIT_MILESTONES,
	type PostSubmitMilestoneKey,
} from "~/modules/domain";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import {
	companies,
	declarationStatusHistory,
	declarations,
	gipMdsData,
} from "~/server/db/schema";

/** Minimum number of completed transitions before showing a median / p90. */
const STEP_DURATION_MIN_SAMPLE = 5;

// Step 6 (« Récapitulatif ») is the terminal submission state — no subsequent
// `step_change` event exists, so its duration is always undefined. Excluded
// from the K4 wizard chart to avoid empty bars.
const WIZARD_TERMINAL_STEP = 6;

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

	/**
	 * Returns the median and p90 duration (days) declarations spend on each
	 * phase of the post-DSN journey, scoped to one campaign year and optionally
	 * to a workforce bucket. Feeds the K4 « délai moyen par étape » chart +
	 * table.
	 *
	 * Two phases:
	 * - **wizard** (steps 0..5) — durations are `LEAD(changed_at) - changed_at`
	 *   over the `step_change` events ordered by time per declaration. Step 6
	 *   (« Récapitulatif ») is the terminal submission state with no following
	 *   `step_change` event, so its duration is undefined and the row is
	 *   excluded. Rows where there is no next event (declaration still on that
	 *   step) are excluded from the percentile aggregation but still count in
	 *   `sampleSize`.
	 * - **post_submit** (4 milestones) — durations between business events
	 *   (`submit`, `path_choice`, `second_declaration_submit`,
	 *   `joint_evaluation_submit`, `cse_opinion_submit`), computed per
	 *   milestone via a dedicated CTE.
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
					AND step < ${WIZARD_TERMINAL_STEP}
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

			const wizardRows = DECLARATION_STEPS.filter(
				({ step }) => step < WIZARD_TERMINAL_STEP,
			).map(
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
				action_to_cse_opinion: undefined,
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

			// Pair `path_choice` and `joint_evaluation_submit` on the same round
			// (per declaration) so each cycle contributes its own duration: the
			// initial wave (round=1) and the revision wave (round=2). A
			// declaration that completes both rounds contributes twice — the
			// aggregate reflects the number of observed durations, not the
			// number of distinct declarations.
			const pathChoiceToJointEvaluationRows =
				await ctx.db.execute<AggregatedMilestone>(sql`
				WITH paired AS (
					SELECT
						s.declaration_id,
						s.round,
						MAX(s.created_at) FILTER (WHERE s.event_type = 'path_choice') AS start_at,
						MIN(s.created_at) FILTER (WHERE s.event_type = 'joint_evaluation_submit') AS end_at
					FROM ${declarationStatusHistory} s
					INNER JOIN ${declarations}
						ON ${declarations.id} = s.declaration_id
					INNER JOIN ${companies}
						ON ${companies.siren} = ${declarations.siren}
					WHERE ${declarations.year} = ${input.year}
						AND ${declarations.cancelledAt} IS NULL
						AND ${sizeFilterSql}
						AND s.event_type IN ('path_choice', 'joint_evaluation_submit')
					GROUP BY s.declaration_id, s.round
					HAVING MAX(s.created_at) FILTER (WHERE s.event_type = 'path_choice') IS NOT NULL
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

			const postSubmitRows = POST_SUBMIT_MILESTONES.map(({ key, label }) =>
				buildPostSubmitRow(key, label, postSubmitAggregates[key]),
			);

			return [...wizardRows, ...postSubmitRows];
		}),

	/**
	 * Returns the dropoff rate per phase of the declarative journey, scoped to
	 * a single campaign year and optionally to a workforce bucket. Feeds the
	 * K5 « taux d'abandon par phase » chart + table.
	 *
	 * Two phases:
	 * - **wizard** (steps 0..5) — declarations that entered a step at least
	 *   once and still sit on it past `stagnationDays`, with `status !=
	 *   'demarche_completed'` and `cancelled_at IS NULL`. Step 6
	 *   (« Récapitulatif ») is excluded because a declaration on the recap
	 *   step is submitted, not abandoned. Back-and-forth (e.g. step 3 → 1 →
	 *   3) counts the declaration once per step; the numerator uses the
	 *   latest entry to assess stagnation so a recent re-entry resets the
	 *   timer.
	 * - **post_submit** (6 blocking FSM statuses) — `awaiting_compliance_-`
	 *   `path_choice`, `corrective_actions_chosen`, `joint_evaluation_chosen`,
	 *   `awaiting_revision_choice`, `revised_joint_evaluation_chosen`,
	 *   `awaiting_cse_opinion`. For each phase, `total` counts declarations
	 *   that ever entered the phase (via the relevant entry event), and
	 *   `abandoned` counts the subset currently stuck on the FSM status with
	 *   no `declaration_status_history` activity in the last
	 *   `stagnationDays`. For the CSE opinion phase, « ever entered » is
	 *   approximated as `cse_required = true` AND at least one journey event
	 *   was emitted — multiple FSM paths can land on this status and we keep
	 *   the count pragmatic.
	 */
	getStepDropoffRate: adminProcedure
		.input(getStepDropoffRateSchema)
		.query(async ({ ctx, input }): Promise<StepDropoffRow[]> => {
			const sizeFilterSql = (() => {
				if (!input.sizeRange) return sql`TRUE`;
				const { min, max } = COMPANY_SIZE_RANGES[input.sizeRange];
				return max === null
					? sql`${companies.workforce} >= ${min}`
					: sql`${companies.workforce} BETWEEN ${min} AND ${max}`;
			})();

			const wizardRawRows = await ctx.db.execute<{
				step: number | string;
				total: number | string;
				abandoned: number | string;
			}>(sql`
				WITH latest_step_change AS (
					SELECT DISTINCT ON (${declarationStatusHistory.declarationId}, ${declarationStatusHistory.round})
						${declarationStatusHistory.declarationId} AS declaration_id,
						${declarationStatusHistory.round} AS step,
						${declarationStatusHistory.createdAt} AS changed_at
					FROM ${declarationStatusHistory}
					WHERE ${declarationStatusHistory.eventType} = 'step_change'
					ORDER BY
						${declarationStatusHistory.declarationId},
						${declarationStatusHistory.round},
						${declarationStatusHistory.createdAt} DESC
				)
				SELECT
					lsc.step AS step,
					COUNT(DISTINCT lsc.declaration_id)::int AS total,
					COUNT(DISTINCT lsc.declaration_id) FILTER (
						WHERE ${declarations.currentStep} = lsc.step
							AND ${declarations.status} != 'demarche_completed'
							AND lsc.changed_at < NOW() - (${input.stagnationDays} || ' days')::interval
					)::int AS abandoned
				FROM latest_step_change lsc
				INNER JOIN ${declarations}
					ON ${declarations.id} = lsc.declaration_id
				INNER JOIN ${companies}
					ON ${companies.siren} = ${declarations.siren}
				WHERE ${declarations.year} = ${input.year}
					AND ${declarations.cancelledAt} IS NULL
					AND lsc.step < ${WIZARD_TERMINAL_STEP}
					AND ${sizeFilterSql}
				GROUP BY lsc.step
				ORDER BY lsc.step
			`);

			const byStep = new Map<number, { total: number; abandoned: number }>();
			for (const raw of wizardRawRows as unknown as Array<{
				step: number | string;
				total: number | string;
				abandoned: number | string;
			}>) {
				byStep.set(Number(raw.step), {
					total: Number(raw.total),
					abandoned: Number(raw.abandoned),
				});
			}

			const wizardRows: StepDropoffRow[] = DECLARATION_STEPS.filter(
				({ step }) => step < WIZARD_TERMINAL_STEP,
			).map(({ step }) => {
				const aggregate = byStep.get(step);
				const total = aggregate?.total ?? 0;
				const abandoned = aggregate?.abandoned ?? 0;
				const dropoffRate =
					total === 0 ? 0 : Math.round((abandoned / total) * 1000) / 10;
				return {
					key: String(step),
					phase: "wizard",
					step,
					label: getStepLabel(step),
					total,
					abandoned,
					dropoffRate,
				};
			});

			// `total` per post-submit phase: declarations whose journey crossed
			// the entry event of that phase. Each branch of the UNION corresponds
			// to one phase; the CSE branch approximates « ever entered » by
			// `cseRequired = true` + at least one journey event (no single event
			// is canonical — multiple FSM paths land on `awaiting_cse_opinion`).
			const postSubmitTotalsRows = await ctx.db.execute<{
				phase: string;
				total: number | string;
			}>(sql`
				WITH phase_totals AS (
					SELECT 'awaiting_compliance_path_choice'::text AS phase,
						COUNT(DISTINCT h.declaration_id)::int AS total
					FROM ${declarationStatusHistory} h
					INNER JOIN ${declarations}
						ON ${declarations.id} = h.declaration_id
					INNER JOIN ${companies}
						ON ${companies.siren} = ${declarations.siren}
					WHERE h.event_type = 'submit'
						AND ${declarations.year} = ${input.year}
						AND ${declarations.cancelledAt} IS NULL
						AND ${sizeFilterSql}
					UNION ALL
					SELECT 'corrective_actions_chosen'::text,
						COUNT(DISTINCT h.declaration_id)::int
					FROM ${declarationStatusHistory} h
					INNER JOIN ${declarations}
						ON ${declarations.id} = h.declaration_id
					INNER JOIN ${companies}
						ON ${companies.siren} = ${declarations.siren}
					WHERE h.event_type = 'path_choice'
						AND h.round = 1
						AND h.value = 'corrective_action'
						AND ${declarations.year} = ${input.year}
						AND ${declarations.cancelledAt} IS NULL
						AND ${sizeFilterSql}
					UNION ALL
					SELECT 'joint_evaluation_chosen'::text,
						COUNT(DISTINCT h.declaration_id)::int
					FROM ${declarationStatusHistory} h
					INNER JOIN ${declarations}
						ON ${declarations.id} = h.declaration_id
					INNER JOIN ${companies}
						ON ${companies.siren} = ${declarations.siren}
					WHERE h.event_type = 'path_choice'
						AND h.round = 1
						AND h.value = 'joint_evaluation'
						AND ${declarations.year} = ${input.year}
						AND ${declarations.cancelledAt} IS NULL
						AND ${sizeFilterSql}
					UNION ALL
					SELECT 'awaiting_revision_choice'::text,
						COUNT(DISTINCT h.declaration_id)::int
					FROM ${declarationStatusHistory} h
					INNER JOIN ${declarations}
						ON ${declarations.id} = h.declaration_id
					INNER JOIN ${companies}
						ON ${companies.siren} = ${declarations.siren}
					WHERE h.event_type = 'second_declaration_submit'
						AND h.round = 2
						AND ${declarations.year} = ${input.year}
						AND ${declarations.cancelledAt} IS NULL
						AND ${sizeFilterSql}
					UNION ALL
					SELECT 'revised_joint_evaluation_chosen'::text,
						COUNT(DISTINCT h.declaration_id)::int
					FROM ${declarationStatusHistory} h
					INNER JOIN ${declarations}
						ON ${declarations.id} = h.declaration_id
					INNER JOIN ${companies}
						ON ${companies.siren} = ${declarations.siren}
					WHERE h.event_type = 'path_choice'
						AND h.round = 2
						AND ${declarations.year} = ${input.year}
						AND ${declarations.cancelledAt} IS NULL
						AND ${sizeFilterSql}
					UNION ALL
					SELECT 'awaiting_cse_opinion'::text,
						COUNT(DISTINCT ${declarations.id})::int
					FROM ${declarations}
					INNER JOIN ${companies}
						ON ${companies.siren} = ${declarations.siren}
					WHERE ${declarations.cseRequired} = true
						AND ${declarations.year} = ${input.year}
						AND ${declarations.cancelledAt} IS NULL
						AND ${sizeFilterSql}
						AND EXISTS (
							SELECT 1 FROM ${declarationStatusHistory} h
							WHERE h.declaration_id = ${declarations.id}
								AND h.event_type IN ('submit', 'path_choice', 'second_declaration_submit', 'joint_evaluation_submit')
						)
				)
				SELECT phase, total FROM phase_totals
			`);

			// `abandoned` per post-submit phase: declarations still stuck on the
			// FSM status today with no history activity in the last
			// `stagnationDays`. Stagnation reference is `MAX(history.created_at)`
			// — the wizard timer is the LSC `changed_at`, the post-submit timer
			// is the freshest of *any* event because no single event marks
			// « entry into the phase » (FSM paths vary).
			const postSubmitAbandonedRows = await ctx.db.execute<{
				phase: string;
				abandoned: number | string;
			}>(sql`
				WITH latest_activity AS (
					SELECT
						h.declaration_id,
						MAX(h.created_at) AS last_activity_at
					FROM ${declarationStatusHistory} h
					GROUP BY h.declaration_id
				)
				SELECT
					${declarations.status}::text AS phase,
					COUNT(DISTINCT ${declarations.id})::int AS abandoned
				FROM ${declarations}
				INNER JOIN ${companies}
					ON ${companies.siren} = ${declarations.siren}
				LEFT JOIN latest_activity la
					ON la.declaration_id = ${declarations.id}
				WHERE ${declarations.year} = ${input.year}
					AND ${declarations.cancelledAt} IS NULL
					AND ${sizeFilterSql}
					AND ${declarations.status} IN (
						'awaiting_compliance_path_choice',
						'corrective_actions_chosen',
						'joint_evaluation_chosen',
						'awaiting_revision_choice',
						'revised_joint_evaluation_chosen',
						'awaiting_cse_opinion'
					)
					AND COALESCE(la.last_activity_at, ${declarations.createdAt})
						< NOW() - (${input.stagnationDays} || ' days')::interval
				GROUP BY ${declarations.status}
			`);

			const totalsByPhase = new Map<string, number>();
			for (const raw of postSubmitTotalsRows as unknown as Array<{
				phase: string;
				total: number | string;
			}>) {
				totalsByPhase.set(raw.phase, Number(raw.total));
			}
			const abandonedByPhase = new Map<string, number>();
			for (const raw of postSubmitAbandonedRows as unknown as Array<{
				phase: string;
				abandoned: number | string;
			}>) {
				abandonedByPhase.set(raw.phase, Number(raw.abandoned));
			}

			const postSubmitRows: StepDropoffRow[] = POST_SUBMIT_DROPOFF_PHASES.map(
				({ key, label, status }) => {
					const total = totalsByPhase.get(status) ?? 0;
					const abandoned = abandonedByPhase.get(status) ?? 0;
					const dropoffRate =
						total === 0 ? 0 : Math.round((abandoned / total) * 1000) / 10;
					return {
						key,
						phase: "post_submit",
						step: null,
						label,
						total,
						abandoned,
						dropoffRate,
					};
				},
			);

			return [...wizardRows, ...postSubmitRows];
		}),
});
