import { z } from "zod";

export const SORT_COLUMNS = [
	"siren",
	"companyName",
	"year",
	"status",
	"declarantEmail",
	"createdAt",
] as const;

export type SortColumn = (typeof SORT_COLUMNS)[number];

export const INDEX_OPERATORS = ["gt", "lt", "eq"] as const;

export type IndexOperator = (typeof INDEX_OPERATORS)[number];

export const DEFAULT_PAGE_SIZE = 20;

export const searchDeclarationsSchema = z.object({
	query: z.string().optional(),
	email: z.string().email().optional().or(z.literal("")),
	year: z.coerce.number().int().min(2018).max(2100).optional(),
	dateFrom: z.string().date().optional().or(z.literal("")),
	dateTo: z.string().date().optional().or(z.literal("")),
	index: z.coerce.number().int().min(0).max(100).optional(),
	indexOperator: z.enum(INDEX_OPERATORS).optional(),
	status: z.enum(["draft", "submitted"]).optional(),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(10).max(100).default(DEFAULT_PAGE_SIZE),
	sortBy: z.enum(SORT_COLUMNS).default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type SearchDeclarationsInput = z.input<typeof searchDeclarationsSchema>;
export type SearchDeclarationsOutput = z.output<
	typeof searchDeclarationsSchema
>;

export const getDeclarationByIdSchema = z.object({
	id: z.string().uuid(),
});

export const deleteDeclarationsSchema = z.object({
	ids: z.array(z.string().uuid()).min(1).max(100),
});
