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

export const DEFAULT_PAGE_SIZE = 20;

export const searchDeclarationsSchema = z.object({
	query: z.string().optional(),
	email: z.string().email().optional().or(z.literal("")),
	year: z.coerce.number().int().min(2018).max(2100).optional(),
	dateFrom: z.string().date().optional().or(z.literal("")),
	dateTo: z.string().date().optional().or(z.literal("")),
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

export const searchDeclarationsFormSchema = z.object({
	query: z.string().optional(),
	email: z.string().optional(),
	year: z.string().optional(),
	dateFrom: z.string().optional(),
	dateTo: z.string().optional(),
	status: z.enum(["", "draft", "submitted"]).optional(),
});

export type SearchDeclarationsFormValues = z.infer<
	typeof searchDeclarationsFormSchema
>;

export const getDeclarationByIdSchema = z.object({
	id: z.string().uuid(),
});
