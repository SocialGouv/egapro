import { z } from "zod";

import { FIRST_DECLARATION_YEAR, getCurrentYear } from "~/modules/domain";

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
					FIRST_DECLARATION_YEAR,
					`year must be >= ${FIRST_DECLARATION_YEAR}`,
				)
				.max(getCurrentYear() + 1, `year must be <= ${getCurrentYear() + 1}`),
		),
});
