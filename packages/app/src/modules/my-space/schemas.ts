import { z } from "zod";

import { phoneSchema } from "~/modules/profile/phone";

export const sirenInputSchema = z.object({
	siren: z.string().length(9),
});

export const updateHasCseSchema = z.object({
	siren: z.string().length(9),
	hasCse: z.boolean(),
});

export const missingInfoSchema = z.object({
	phone: phoneSchema.or(z.literal("")),
	hasCse: z.boolean().optional(),
});
