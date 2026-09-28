import { z } from "zod";

import {
	COMPANY_SIZE_RANGES,
	DROPOFF_STAGNATION_DAYS_DEFAULT,
	DROPOFF_STAGNATION_DAYS_MAX,
	DROPOFF_STAGNATION_DAYS_MIN,
} from "~/modules/domain";

const COMPANY_SIZE_RANGE_KEYS = Object.keys(COMPANY_SIZE_RANGES) as Array<
	keyof typeof COMPANY_SIZE_RANGES
>;

/**
 * Input for `adminStats.getCampaignProgression`.
 *
 * `years`: campaign years whose cumulative submission curves must be returned.
 * Min 1 / max 5 to keep the chart readable.
 *
 * `sizeRange`: optional workforce bucket to scope both the chart and the
 * underlying aggregation (undefined = all sizes).
 */
export const getCampaignProgressionSchema = z.object({
	years: z.array(z.number().int().min(2000).max(2100)).min(1).max(5),
	sizeRange: z.enum(COMPANY_SIZE_RANGE_KEYS).optional(),
});

export type GetCampaignProgressionInput = z.infer<
	typeof getCampaignProgressionSchema
>;

export const getCampaignStatsSchema = z.object({
	year: z.number().int().min(2000).max(2100),
	sizeRange: z.enum(COMPANY_SIZE_RANGE_KEYS).optional(),
});

export type GetCampaignStatsInput = z.infer<typeof getCampaignStatsSchema>;

/**
 * Input for `adminStats.getStepDurations`.
 *
 * `year`: campaign year scoped for the K4 chart (single year, the comparison
 * is intra-step rather than inter-year).
 *
 * `sizeRange`: optional workforce bucket scoping the aggregation.
 */
export const getStepDurationsSchema = z.object({
	year: z.number().int().min(2000).max(2100),
	sizeRange: z.enum(COMPANY_SIZE_RANGE_KEYS).optional(),
});

export type GetStepDurationsInput = z.infer<typeof getStepDurationsSchema>;

/**
 * Input for `adminStats.getStepDropoffRate`.
 *
 * `stagnationDays`: a declaration is counted as abandoned on step E when its
 * latest entry on E is older than this many days. Defaults to 30 days; bounded
 * (1..180) so the query stays meaningful for a campaign cycle.
 */
export const getStepDropoffRateSchema = z.object({
	year: z.number().int().min(2000).max(2100),
	sizeRange: z.enum(COMPANY_SIZE_RANGE_KEYS).optional(),
	stagnationDays: z
		.number()
		.int()
		.min(DROPOFF_STAGNATION_DAYS_MIN)
		.max(DROPOFF_STAGNATION_DAYS_MAX)
		.default(DROPOFF_STAGNATION_DAYS_DEFAULT),
});

export type GetStepDropoffRateInput = z.infer<typeof getStepDropoffRateSchema>;

/**
 * Input for `adminStats.getCompletionFunnel`.
 *
 * `year`: campaign year scoped for the K19 funnels — one year at a time, the
 * funnels compare step counts not inter-year curves.
 *
 * `sizeRange`: optional workforce bucket scoping the aggregation (undefined =
 * all sizes).
 */
export const getCompletionFunnelSchema = z.object({
	year: z.number().int().min(2000).max(2100),
	sizeRange: z.enum(COMPANY_SIZE_RANGE_KEYS).optional(),
});

export type GetCompletionFunnelInput = z.infer<
	typeof getCompletionFunnelSchema
>;

/**
 * Input for `adminStats.getMatomoFunnel`.
 *
 * Same year/workforce filter couple as the sibling procedures. The workforce
 * bucket only segments the declaration funnel — `cse_opinion` /
 * `compliance_path` emit only the campaign-year dimension, so the service
 * applies `sizeRange` to the declaration funnel alone.
 */
export const getMatomoFunnelSchema = z.object({
	year: z.number().int().min(2000).max(2100),
	sizeRange: z.enum(COMPANY_SIZE_RANGE_KEYS).optional(),
});

export type GetMatomoFunnelInput = z.infer<typeof getMatomoFunnelSchema>;

/**
 * Shape of a single row returned by the Matomo Reporting API `Events.*`
 * methods. Only the fields the funnel service consumes are validated; any extra
 * Matomo columns (nb_visits, nb_uniq_visitors…) are stripped.
 */
export const matomoEventRowSchema = z.object({
	label: z.string(),
	nb_events: z.number().optional(),
	idsubdatatable: z.union([z.number(), z.string()]).optional(),
	// `nb_visits` is returned by `DevicesDetection.getType` (device breakdown);
	// `avg_event_value` by `Events.*` for actions carrying a numeric value (mean
	// import duration). Matomo occasionally serialises the average as a string.
	nb_visits: z.number().optional(),
	avg_event_value: z.union([z.number(), z.string()]).optional(),
});

export type MatomoEventRow = z.infer<typeof matomoEventRowSchema>;

/**
 * Response of a Matomo Reporting API `Events.*` call: either an array of event
 * rows, or an error object (`{ result, message }`) Matomo returns on a bad
 * request. Validating at this external boundary lets `matomo.ts` degrade a
 * malformed/unexpected response to an empty funnel instead of trusting an
 * unchecked `as` cast.
 */
export const matomoReportingResponseSchema = z.union([
	z.array(matomoEventRowSchema),
	z.object({
		result: z.string().optional(),
		message: z.string().optional(),
	}),
]);
