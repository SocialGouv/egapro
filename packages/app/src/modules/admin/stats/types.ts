/**
 * One point on the campaign progression curve.
 * `day` is an ISO date (YYYY-MM-DD) — the calendar day the cumulative count
 * reached `cumulative`.
 */
export type CampaignProgressionPoint = {
	day: string;
	cumulative: number;
};

/**
 * One year's worth of cumulative-submission points, ordered chronologically.
 */
export type CampaignProgressionSeries = {
	year: number;
	points: CampaignProgressionPoint[];
};

export type CampaignStats = {
	totalObligated: number;
	totalSubmitted: number;
	submissionRate: number;
	previousYearRate: number | null;
};

/**
 * One row of the K4 « délai moyen par étape » dataset.
 *
 * Covers both phases of the journey:
 * - **wizard phase** (`phase: "wizard"`, `step` set to 0..6) — durations spent
 *   on each step of the A–F stepper, computed from `step_change` events.
 * - **post-submit phase** (`phase: "post_submit"`, `step: null`) — durations
 *   between business milestones (path choice, action, CSE opinion, complete),
 *   computed from business events in `declaration_status_history`.
 *
 * `key` is a stable identifier (e.g. `step_0`, `submit_to_path_choice`) used as
 * the React key in the chart and as the row identity in tests. `medianDays` /
 * `p90Days` are null when the completed sample is too small (< 5) to surface
 * statistically meaningful percentiles.
 */
export type StepDurationRow = {
	key: string;
	phase: "wizard" | "post_submit";
	step: number | null;
	label: string;
	sampleSize: number;
	completedSampleSize: number;
	medianDays: number | null;
	p90Days: number | null;
};

/**
 * One row of the K5 « taux d'abandon par phase » dataset.
 *
 * Covers both halves of the journey:
 * - **wizard phase** (`phase: "wizard"`, `step` set to 0..5) — declarations
 *   that entered a step at least once and stagnate on it past
 *   `stagnationDays`. Step 6 (« Récapitulatif ») is excluded since a
 *   declaration on the recap step is submitted, not abandoned.
 * - **post-submit phase** (`phase: "post_submit"`, `step: null`) — the 6
 *   blocking FSM statuses (path choice, second declaration, joint
 *   evaluation, revision choice, revised joint evaluation, CSE opinion).
 *   `total` counts declarations that ever entered the phase; `abandoned`
 *   counts the subset still stuck on the FSM status with no activity in the
 *   last `stagnationDays`.
 *
 * `key` is a stable identifier (`"0"`..`"5"` for wizard steps, FSM status
 * for post-submit phases) used as the React key in the chart and as the row
 * identity in tests. `dropoffRate` is `(abandoned / total) * 100`, rounded
 * to 1 decimal, and defaults to 0 when `total` is 0.
 */
export type StepDropoffRow = {
	key: string;
	phase: "wizard" | "post_submit";
	step: number | null;
	label: string;
	total: number;
	abandoned: number;
	dropoffRate: number;
};

/**
 * One row of a K19 completion funnel.
 *
 * Each row represents a single jalon (step) of the funnel:
 * - `count`: distinct declarations that reached this jalon.
 * - `pctOfStart`: percentage of `count` relative to the first jalon of the
 *   funnel (= 100 for the first row, 0 if the first jalon is empty).
 * - `pctDropFromPrev`: percentage drop from the previous jalon (null for the
 *   first row, 0 when the previous jalon is empty so we cannot compute a
 *   meaningful drop).
 */
export type FunnelRow = {
	key: string;
	label: string;
	count: number;
	pctOfStart: number;
	pctDropFromPrev: number | null;
};

/**
 * Output of `adminStats.getCompletionFunnel`.
 *
 * Four sibling funnels rendered on `/admin/stats/plateforme`:
 * - `mainFunnel`: all declarations of the year.
 * - `complianceFunnel`: sub-population that crossed the alert threshold.
 * - `revisionFunnel`: sub-population that re-entered a revision cycle.
 * - `cseFunnel`: declarations whose company has a CSE (`companies.has_cse = true`).
 */
export type CompletionFunnelOutput = {
	mainFunnel: FunnelRow[];
	complianceFunnel: FunnelRow[];
	revisionFunnel: FunnelRow[];
	cseFunnel: FunnelRow[];
};
