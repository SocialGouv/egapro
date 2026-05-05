import { z } from "zod";

import { COUNTY_CODES, REGION_CODES } from "~/modules/domain";

export const SORT_COLUMNS = [
	"region",
	"county",
	"name",
	"value",
	"principal",
	"createdAt",
] as const;

export type SortColumn = (typeof SORT_COLUMNS)[number];

export const DEFAULT_PAGE_SIZE = 20;

export const searchReferentsSchema = z.object({
	region: z.enum(REGION_CODES).optional().or(z.literal("")),
	county: z.enum(COUNTY_CODES).optional().or(z.literal("")),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(10).max(100).default(DEFAULT_PAGE_SIZE),
	sortBy: z.enum(SORT_COLUMNS).default("region"),
	sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type SearchReferentsInput = z.input<typeof searchReferentsSchema>;
export type SearchReferentsOutput = z.output<typeof searchReferentsSchema>;

export const searchReferentsFormSchema = z.object({
	region: z.string().optional(),
	county: z.string().optional(),
});

export type SearchReferentsFormValues = z.infer<
	typeof searchReferentsFormSchema
>;

const baseReferentFields = {
	region: z.enum(REGION_CODES),
	county: z.enum(COUNTY_CODES).optional().or(z.literal("")),
	name: z.string().min(1, "Le nom est obligatoire"),
	principal: z.boolean().default(false),
	substituteName: z.string().optional().or(z.literal("")),
	substituteEmail: z
		.string()
		.email("L'email du suppléant est invalide")
		.optional()
		.or(z.literal("")),
};

export const createReferentSchema = z.discriminatedUnion("type", [
	z.object({
		...baseReferentFields,
		type: z.literal("email"),
		value: z.string().email("L'email est invalide"),
	}),
	z.object({
		...baseReferentFields,
		type: z.literal("url"),
		value: z.string().url("L'URL est invalide"),
	}),
]);

export type CreateReferentInput = z.infer<typeof createReferentSchema>;

export const editReferentSchema = z.discriminatedUnion("type", [
	z.object({
		id: z.string().uuid(),
		...baseReferentFields,
		type: z.literal("email"),
		value: z.string().email("L'email est invalide"),
	}),
	z.object({
		id: z.string().uuid(),
		...baseReferentFields,
		type: z.literal("url"),
		value: z.string().url("L'URL est invalide"),
	}),
]);

export type EditReferentInput = z.infer<typeof editReferentSchema>;

export const deleteReferentsSchema = z.object({
	ids: z.array(z.string().uuid()).min(1).max(100),
});

export const importReferentsSchema = z.array(createReferentSchema).min(1);

export type ImportReferentsInput = z.infer<typeof importReferentsSchema>;

export const referentFormSchema = z.object({
	region: z.enum(REGION_CODES),
	county: z.enum(COUNTY_CODES).optional().or(z.literal("")),
	name: z.string().min(1, "Le nom est obligatoire"),
	principal: z.boolean(),
	substituteName: z.string().optional().or(z.literal("")),
	substituteEmail: z
		.string()
		.email("L'email du suppléant est invalide")
		.optional()
		.or(z.literal("")),
	type: z.enum(["email", "url"]),
	value: z.string().min(1, "La valeur est obligatoire"),
});

export type ReferentFormValues = z.infer<typeof referentFormSchema>;
