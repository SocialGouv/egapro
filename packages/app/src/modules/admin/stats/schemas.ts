import { z } from "zod";

import { COMPANY_SIZE_RANGES } from "~/modules/domain";

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

/**
 * Input for `adminStats.getGapAlertRate` (K8 — Taux d'écart ≥ 5 %).
 *
 * `year`: campaign year whose rate is computed. The KPI also fetches the
 * previous year internally for the delta.
 *
 * `sizeRange`: workforce bucket — both numerator and denominator are scoped.
 *
 * `nafCodePrefix`: single NAF section letter (A–U). Filters companies whose
 * `nafCode` starts with that letter.
 */
export const getGapAlertRateSchema = z.object({
	year: z.number().int().min(2000).max(2100),
	sizeRange: z.enum(COMPANY_SIZE_RANGE_KEYS).optional(),
	nafCodePrefix: z
		.string()
		.length(1)
		.regex(/^[A-U]$/, "Le code NAF doit être une lettre majuscule entre A et U")
		.optional(),
});

export type GetGapAlertRateInput = z.infer<typeof getGapAlertRateSchema>;
