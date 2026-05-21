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
