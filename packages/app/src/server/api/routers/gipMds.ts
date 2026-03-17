import { TRPCError } from "@trpc/server";

import { env } from "~/env.js";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { fetchGipCsv, importGipCsvToDb } from "~/server/services/gipMds";

export const gipMdsRouter = createTRPCRouter({
	/**
	 * Import GIP MDS data from the configured API URL (EGAPRO_GIP_MDS_API_URL).
	 * Fetches the CSV, parses it, and upserts all rows for the detected year.
	 */
	importFromUrl: protectedProcedure.mutation(async ({ ctx }) => {
		const url = env.EGAPRO_GIP_MDS_API_URL;
		if (!url) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "EGAPRO_GIP_MDS_API_URL is not configured",
			});
		}

		try {
			const csvContent = await fetchGipCsv(url);
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
