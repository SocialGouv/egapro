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
