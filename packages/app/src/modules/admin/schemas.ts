import { z } from "zod";

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

export const releaseLockSchema = z.object({
	declarationId: z.string().uuid(),
});

export type ReleaseLockInput = z.infer<typeof releaseLockSchema>;
