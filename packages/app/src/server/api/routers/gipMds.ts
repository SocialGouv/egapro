import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { fetchGipCsv, importGipCsvToDb } from "~/server/services/gipMds";

export const gipMdsRouter = createTRPCRouter({
	/**
	 * Import GIP MDS data from a URL.
	 * Fetches the CSV, parses it, and upserts all rows for the detected year.
	 */
	importFromUrl: protectedProcedure
		.input(z.object({ url: z.string().url() }))
		.mutation(async ({ ctx, input }) => {
			try {
				const csvContent = await fetchGipCsv(input.url);
				const result = await importGipCsvToDb(ctx.db, csvContent);
				return result;
			} catch (error) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message:
						error instanceof Error
							? error.message
							: "Erreur lors de l'import GIP MDS",
				});
			}
		}),
});
