import { z } from "zod";

import {
	DECLARATION_FSM_STATUSES,
	FIRST_DECLARATION_YEAR,
} from "~/modules/domain";

export const SORT_COLUMNS = [
	"siren",
	"companyName",
	"year",
	"status",
	"declarantEmail",
	"createdAt",
] as const;

export type SortColumn = (typeof SORT_COLUMNS)[number];

export const DEFAULT_PAGE_SIZE = 20;

// Admin status filter = the FSM states + the admin-only "cancelled" filter (cancelledAt is set, not an FSM state — see queries.ts). Derived from DECLARATION_FSM_STATUSES so a new engine state propagates here by construction (or breaks tsc), never a hand-copied list.
export const ADMIN_DECLARATION_STATUS_FILTERS = [
	...DECLARATION_FSM_STATUSES,
	"cancelled",
] as const;

// The form select also offers the empty "all statuses" option.
const ADMIN_DECLARATION_STATUS_FORM_OPTIONS = [
	"",
	...ADMIN_DECLARATION_STATUS_FILTERS,
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
	status: z.enum(ADMIN_DECLARATION_STATUS_FILTERS).optional(),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(10).max(100).default(DEFAULT_PAGE_SIZE),
	sortBy: z.enum(SORT_COLUMNS).default("createdAt"),
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
	status: z.enum(ADMIN_DECLARATION_STATUS_FORM_OPTIONS).optional(),
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
