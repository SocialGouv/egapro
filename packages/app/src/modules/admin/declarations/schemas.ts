import { z } from "zod";

import {
	COMPANY_SIZE_RANGES,
	DEMARCHE_LIFECYCLE_STATUSES,
	FIRST_DECLARATION_YEAR,
} from "~/modules/domain";

export const SORT_COLUMNS = [
	"siren",
	"companyName",
	"year",
	"workforce",
	"demarcheStatus",
	"declarantEmail",
	"statusDate",
] as const;

export type SortColumn = (typeof SORT_COLUMNS)[number];

export const DEFAULT_SORT_BY = "statusDate" satisfies SortColumn;

export const DEFAULT_PAGE_SIZE = 20;

// Derived from the domain constant so a new bracket propagates here or breaks tsc.
const COMPANY_SIZE_RANGE_KEYS = Object.keys(COMPANY_SIZE_RANGES) as Array<
	keyof typeof COMPANY_SIZE_RANGES
>;

// Both form selects also offer the empty "all sizes" / "all statuses" option.
const COMPANY_SIZE_RANGE_FORM_OPTIONS = [
	"",
	...COMPANY_SIZE_RANGE_KEYS,
] as const;

const DEMARCHE_STATUS_FORM_OPTIONS = [
	"",
	...DEMARCHE_LIFECYCLE_STATUSES,
] as const;

export const searchDeclarationsSchema = z.object({
	query: z.string().optional(),
	email: z.string().email().optional().or(z.literal("")),
	year: z.coerce
		.number()
		.int()
		.min(FIRST_DECLARATION_YEAR)
		.max(2100)
		.optional(),
	dateFrom: z.string().date().optional().or(z.literal("")),
	dateTo: z.string().date().optional().or(z.literal("")),
	status: z.enum(DEMARCHE_LIFECYCLE_STATUSES).optional(),
	sizeRange: z.enum(COMPANY_SIZE_RANGE_KEYS).optional(),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(10).max(100).default(DEFAULT_PAGE_SIZE),
	sortBy: z.enum(SORT_COLUMNS).default(DEFAULT_SORT_BY),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type SearchDeclarationsInput = z.input<typeof searchDeclarationsSchema>;
export type SearchDeclarationsOutput = z.output<
	typeof searchDeclarationsSchema
>;

export const searchDeclarationsFormSchema = z.object({
	query: z.string().optional(),
	email: z.string().optional(),
	year: z.string().optional(),
	dateFrom: z.string().optional(),
	dateTo: z.string().optional(),
	status: z.enum(DEMARCHE_STATUS_FORM_OPTIONS).optional(),
	sizeRange: z.enum(COMPANY_SIZE_RANGE_FORM_OPTIONS).optional(),
});

export type SearchDeclarationsFormValues = z.infer<
	typeof searchDeclarationsFormSchema
>;

export const getDeclarationByIdSchema = z.object({
	id: z.string().uuid(),
});

export const cancelDeclarationSchema = z.object({
	id: z.string().uuid(),
});

export const getRecapSchema = z.object({
	id: z.string().uuid(),
});

export const releaseLockSchema = z.object({
	declarationId: z.string().uuid(),
});

export type ReleaseLockInput = z.infer<typeof releaseLockSchema>;
