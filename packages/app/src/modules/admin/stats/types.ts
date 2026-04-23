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
 * K8 — "Taux d'écart ≥ 5 %" tile payload.
 *
 * `rate` / `previousRate` are percentages 0..100, one decimal. `null` when
 * the denominator is zero (no declaration matches the filters).
 *
 * `delta` is the percentage-point difference between `rate` and `previousRate`;
 * `null` when either side is missing (no historical data, empty sample).
 *
 * `sampleSize` is the number of declarations retained by the filters for the
 * current year — always returned, even when `rate` is null.
 */
export type GapAlertRateResult = {
	rate: number | null;
	previousRate: number | null;
	delta: number | null;
	sampleSize: number;
};
