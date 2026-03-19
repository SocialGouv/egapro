import { z } from "zod";

export const sirenInputSchema = z.object({
	siren: z.string().length(9),
});

export const updateHasCseSchema = z.object({
	siren: z.string().length(9),
	hasCse: z.boolean(),
});
