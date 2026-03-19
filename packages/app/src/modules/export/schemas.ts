import { z } from "zod";

export const exportYearQuerySchema = z.object({
	year: z
		.string()
		.regex(/^\d{4}$/, "Year must be YYYY format")
		.transform(Number),
});

export type ExportYearQuery = z.infer<typeof exportYearQuerySchema>;

export const exportYearOptionalQuerySchema = z.object({
	year: z
		.string()
		.regex(/^\d{4}$/, "Year must be YYYY format")
		.transform(Number)
		.optional(),
});

export type ExportYearOptionalQuery = z.infer<
	typeof exportYearOptionalQuerySchema
>;

export const exportDeclarationsQuerySchema = z.object({
	date_begin: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "date_begin must be YYYY-MM-DD format"),
	date_end: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "date_end must be YYYY-MM-DD format")
		.optional(),
});

export type ExportDeclarationsQuery = z.infer<
	typeof exportDeclarationsQuerySchema
>;
