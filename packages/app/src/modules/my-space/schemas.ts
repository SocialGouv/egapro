import { z } from "zod";

import { phoneSchema } from "~/modules/profile/phone";

export const sirenInputSchema = z.object({
	siren: z.string().length(9),
});

export const updateHasCseSchema = z.object({
	siren: z.string().length(9),
	hasCse: z.boolean(),
});

/** Radio buttons always produce strings — transform "true"/"false" to boolean. */
const hasCseFromRadio = z
	.union([z.boolean(), z.literal("true"), z.literal("false")])
	.transform((v): boolean => (typeof v === "string" ? v === "true" : v))
	.optional();

export function createMissingInfoSchema(needsPhone: boolean) {
	return z.object({
		phone: needsPhone ? phoneSchema : z.string(),
		hasCse: hasCseFromRadio,
	});
}
