import { z } from "zod";

const MIN_DECLARATION_YEAR = 2018;
const MAX_DECLARATION_YEAR = new Date().getFullYear() + 1;

export const exportYearQuerySchema = z.object({
	year: z
		.string()
		.regex(/^\d{4}$/, "Year must be YYYY format")
		.transform(Number),
});

export const exportYearOptionalQuerySchema = z.object({
	year: z
		.string()
		.regex(/^\d{4}$/, "Year must be YYYY format")
		.transform(Number)
		.optional(),
});

export const exportDeclarationsQuerySchema = z.object({
	date_begin: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "date_begin must be YYYY-MM-DD format"),
	date_end: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "date_end must be YYYY-MM-DD format")
		.optional(),
});

export const exportFilesQuerySchema = z.object({
	siren: z.string().regex(/^\d{9}$/, "siren must be 9 digits"),
	year: z
		.string()
		.regex(/^\d{4}$/, "year must be YYYY format")
		.transform(Number)
		.pipe(
			z
				.number()
				.int()
				.min(
					MIN_DECLARATION_YEAR,
					`year must be greater than or equal to ${MIN_DECLARATION_YEAR}`,
				)
				.max(
					MAX_DECLARATION_YEAR,
					`year must be less than or equal to ${MAX_DECLARATION_YEAR}`,
				),
		),
});
