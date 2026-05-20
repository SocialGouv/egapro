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

/**
 * One row of the K4 « délai moyen par étape » dataset.
 *
 * `step` is the integer index (0..6) of the A–F stepper. `medianDays` and
 * `p90Days` are the 50th and 90th percentiles of the duration (in days)
 * declarations spent on that step before transitioning to a later one.
 *
 * `sampleSize` counts how many declarations reached that step (whether or not
 * they exited). When too few declarations have exited the step
 * (`completedSampleSize < 5`), `medianDays` and `p90Days` are `null` to avoid
 * surfacing statistically meaningless numbers.
 */
export type StepDurationRow = {
	step: number;
	label: string;
	sampleSize: number;
	completedSampleSize: number;
	medianDays: number | null;
	p90Days: number | null;
};
