import { z } from "zod";

export const sirenInputSchema = z.object({
	siren: z.string().length(9),
});

export type SirenInput = z.infer<typeof sirenInputSchema>;

export const updateHasCseSchema = z.object({
	siren: z.string().length(9),
	hasCse: z.boolean(),
});

export type UpdateHasCseInput = z.infer<typeof updateHasCseSchema>;
