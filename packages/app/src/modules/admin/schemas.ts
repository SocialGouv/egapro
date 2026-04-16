import { z } from "zod";

import {
	companySizeRangeSchema,
	FIRST_DECLARATION_YEAR,
} from "~/modules/domain";

/**
 * Shared Zod schemas for the backoffice (admin) module.
 *
 * Used by both the `admin` tRPC router and the React forms via
 * `useZodForm`, per the project convention (schemas live in the module,
 * never inline in routers).
 */

/** 9-digit SIREN — tolerates spaces (e.g. "775 670 417"). */
export const sirenSchema = z
	.string()
	.transform((v) => v.replace(/\s/g, ""))
	.pipe(
		z
			.string()
			.regex(/^\d{9}$/, "Le SIREN doit contenir exactement 9 chiffres."),
	);

export const impersonateSearchSchema = z.object({
	siren: sirenSchema,
});

export type ImpersonateSearchInput = z.infer<typeof impersonateSearchSchema>;

export const startImpersonateSchema = z.object({
	siren: sirenSchema,
});

export type StartImpersonateInput = z.infer<typeof startImpersonateSchema>;

/**
 * Input for the campaign-wide KPIs shown on `/admin/stats`.
 *
 * `year` must be a concrete campaign year (no default — the admin UI
 * populates the select with the current year). `sizeRange` is optional:
 * omitted means "all company sizes" and is applied to both numerator and
 * denominator so the ratio stays consistent.
 */
export const campaignStatsSchema = z.object({
	year: z.number().int().min(FIRST_DECLARATION_YEAR),
	sizeRange: companySizeRangeSchema.optional(),
});

export type CampaignStatsInput = z.infer<typeof campaignStatsSchema>;
