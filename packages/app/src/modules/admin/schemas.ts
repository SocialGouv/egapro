import { z } from "zod";

/**
 * Shared Zod schemas for the backoffice (admin) module.
 *
 * Used by both the `admin` tRPC router and the React forms via
 * `useZodForm`, per the project convention (schemas live in the module,
 * never inline in routers).
 */

/** Strict 9-digit SIREN. */
export const sirenSchema = z
	.string()
	.regex(/^\d{9}$/, "Le SIREN doit contenir exactement 9 chiffres.");

export const impersonateSearchSchema = z.object({
	siren: sirenSchema,
});

export type ImpersonateSearchInput = z.infer<typeof impersonateSearchSchema>;

export const startImpersonateSchema = z.object({
	siren: sirenSchema,
});

export type StartImpersonateInput = z.infer<typeof startImpersonateSchema>;
