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

/**
 * Input for `adminStats.getMultiYearGapTrend` (K10 — Évolution annuelle
 * des écarts).
 *
 * `yearFrom` / `yearTo`: inclusive range on `declarations.year`. `yearTo`
 * must be ≥ `yearFrom`; the span is capped at 10 years to keep the chart
 * readable.
 *
 * `segmentBy`: which dimension drives the series split:
 *   - `"global"` → one "National" curve
 *   - `"workforce"` → one curve per `COMPANY_SIZE_RANGES` bucket
 *   - `"naf"` → one curve per dominant NAF section (5) + `"Autres"`
 *
 * `sizeRange` / `nafCodePrefix`: extra filters. Silently ignored by the
 * procedure when they would contradict the segmentation (e.g. filtering
 * by `sizeRange` while `segmentBy === "workforce"`).
 */
export const getMultiYearGapTrendSchema = z
	.object({
		yearFrom: z.number().int().min(2000).max(2100),
		yearTo: z.number().int().min(2000).max(2100),
		segmentBy: z.enum(["global", "workforce", "naf"]),
		sizeRange: z.enum(COMPANY_SIZE_RANGE_KEYS).optional(),
		nafCodePrefix: z
			.string()
			.length(1)
			.regex(
				/^[A-U]$/,
				"Le code NAF doit être une lettre majuscule entre A et U",
			)
			.optional(),
	})
	.refine((input) => input.yearTo >= input.yearFrom, {
		message: "yearTo doit être supérieur ou égal à yearFrom",
		path: ["yearTo"],
	})
	.refine((input) => input.yearTo - input.yearFrom <= 9, {
		message: "La plage d'années ne peut pas dépasser 10 ans",
		path: ["yearTo"],
	});

export type GetMultiYearGapTrendInput = z.infer<
	typeof getMultiYearGapTrendSchema
>;
