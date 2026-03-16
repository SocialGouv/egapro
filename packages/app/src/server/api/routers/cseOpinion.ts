import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

import { saveOpinionsSchema } from "~/modules/cseOpinion/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { cseOpinions } from "~/server/db/schema";

function getSiren(siret: string | null | undefined): string {
	if (!siret) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "SIRET manquant dans la session",
		});
	}
	return siret.slice(0, 9);
}

function getCseYear() {
	return new Date().getFullYear() + 1;
}

export const cseOpinionRouter = createTRPCRouter({
	get: protectedProcedure.query(async ({ ctx }) => {
		const siren = getSiren(ctx.session.user.siret);
		const year = getCseYear();

		const rows = await ctx.db
			.select({
				declarationNumber: cseOpinions.declarationNumber,
				type: cseOpinions.type,
				opinion: cseOpinions.opinion,
				opinionDate: cseOpinions.opinionDate,
				gapConsulted: cseOpinions.gapConsulted,
			})
			.from(cseOpinions)
			.where(and(eq(cseOpinions.siren, siren), eq(cseOpinions.year, year)));

		return { opinions: rows };
	}),

	saveOpinions: protectedProcedure
		.input(saveOpinionsSchema)
		.mutation(async ({ ctx, input }) => {
			const siren = getSiren(ctx.session.user.siret);
			const year = getCseYear();
			const declarantId = ctx.session.user.id;

			await ctx.db.transaction(async (tx) => {
				// Delete existing opinions for this siren/year
				await tx
					.delete(cseOpinions)
					.where(and(eq(cseOpinions.siren, siren), eq(cseOpinions.year, year)));

				const rows: (typeof cseOpinions.$inferInsert)[] = [];

				// First declaration — accuracy
				rows.push({
					siren,
					year,
					declarationNumber: 1,
					type: "accuracy",
					opinion: input.firstDeclaration.accuracyOpinion,
					opinionDate: input.firstDeclaration.accuracyDate,
					declarantId,
				});

				// First declaration — gap
				rows.push({
					siren,
					year,
					declarationNumber: 1,
					type: "gap",
					gapConsulted: input.firstDeclaration.gapConsulted,
					opinion: input.firstDeclaration.gapOpinion,
					opinionDate: input.firstDeclaration.gapDate,
					declarantId,
				});

				// Second declaration — accuracy
				rows.push({
					siren,
					year,
					declarationNumber: 2,
					type: "accuracy",
					opinion: input.secondDeclaration.accuracyOpinion,
					opinionDate: input.secondDeclaration.accuracyDate,
					declarantId,
				});

				// Second declaration — gap
				rows.push({
					siren,
					year,
					declarationNumber: 2,
					type: "gap",
					gapConsulted: input.secondDeclaration.gapConsulted,
					opinion: input.secondDeclaration.gapOpinion,
					opinionDate: input.secondDeclaration.gapDate,
					declarantId,
				});

				await tx.insert(cseOpinions).values(rows);
			});

			return { success: true };
		}),
});
