import { z } from "zod";

import { FIRST_DECLARATION_YEAR } from "~/modules/domain";

/**
 * Shared Zod schemas for the admin settings module (global platform variables).
 *
 * Consumed by both the `adminSettings` tRPC router and the React forms via
 * `useZodForm`. Never define these inline in routers.
 */

/** "YYYY-MM-DD" string used by native `<input type="date">`. */
const isoDateString = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (AAAA-MM-JJ).");

const optionalIsoDateString = z
	.union([isoDateString, z.literal("")])
	.transform((v) => (v === "" ? null : v))
	.nullable();

export const campaignYearSchema = z
	.number()
	.int()
	.min(FIRST_DECLARATION_YEAR, `Année minimale : ${FIRST_DECLARATION_YEAR}.`)
	.max(2100, "Année maximale : 2100.");

export const campaignDeadlinesFormSchema = z
	.object({
		year: campaignYearSchema,
		campaignStartDate: optionalIsoDateString,
		publicDataReleaseDate: optionalIsoDateString,
		decl1ModificationDeadline: isoDateString,
		decl1JustificationDeadline: isoDateString,
		decl1JointEvaluationDeadline: isoDateString,
		decl2ModificationDeadline: isoDateString,
		decl2JustificationDeadline: isoDateString,
		decl2JointEvaluationDeadline: isoDateString,
	})
	.refine(
		(data) => data.decl1ModificationDeadline < data.decl2ModificationDeadline,
		{
			message:
				"La deadline de la deuxième déclaration doit être postérieure à celle de la première.",
			path: ["decl2ModificationDeadline"],
		},
	);

export type CampaignDeadlinesFormInput = z.input<
	typeof campaignDeadlinesFormSchema
>;
export type CampaignDeadlinesFormValues = z.output<
	typeof campaignDeadlinesFormSchema
>;

export const getCampaignDeadlinesByYearSchema = z.object({
	year: campaignYearSchema,
});

export const updateLockTimeoutSchema = z.object({
	timeoutMinutes: z.number().int().min(1).max(1440),
});

export type UpdateLockTimeoutInput = z.infer<typeof updateLockTimeoutSchema>;
