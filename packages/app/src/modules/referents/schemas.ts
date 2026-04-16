import { z } from "zod";

import { COUNTY_CODES, REGION_CODES } from "~/modules/domain";

import { PUBLIC_PAGE_SIZE } from "./shared/constants";

/**
 * Input schema for the public referents search procedure.
 *
 * Region/county accept empty strings because HTML <select> elements emit `""`
 * for the "Toutes" / "Tous" options; we normalize to `undefined` at the border.
 */
export const publicSearchReferentsSchema = z.object({
	query: z.string().trim().optional(),
	region: z.enum(REGION_CODES).optional().or(z.literal("")),
	county: z.enum(COUNTY_CODES).optional().or(z.literal("")),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(10).max(100).default(PUBLIC_PAGE_SIZE),
});

export type PublicSearchReferentsInput = z.input<
	typeof publicSearchReferentsSchema
>;
export type PublicSearchReferentsOutput = z.output<
	typeof publicSearchReferentsSchema
>;

/**
 * Form-only schema for the search form — no pagination fields, those live in
 * the URL and are managed by the page container.
 */
export const publicSearchReferentsFormSchema = z.object({
	query: z.string().optional(),
	region: z.string().optional(),
	county: z.string().optional(),
});

export type PublicSearchReferentsFormValues = z.infer<
	typeof publicSearchReferentsFormSchema
>;

export const publicReferentIdSchema = z.object({
	id: z.string().uuid(),
});
