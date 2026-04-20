"use client";

import { useZodForm } from "~/modules/shared";

export type ReferentsSearchFormSchema = Parameters<typeof useZodForm>[0];

/**
 * Thin wrapper around `useZodForm` so `ReferentsSearchForm` never has to
 * import Zod directly (which is blocked in components). The schema is passed
 * in from the admin or public route which imports it from the colocated
 * `schemas.ts`.
 */
export function useReferentsSearchForm(
	schema: ReferentsSearchFormSchema,
	defaultValues: { query: string; region: string; county: string },
) {
	return useZodForm(schema, { defaultValues });
}
