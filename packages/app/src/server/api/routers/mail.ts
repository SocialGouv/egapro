import { TRPCError } from "@trpc/server";
import { resendReceiptSchema } from "~/modules/mail/schemas";
import { companyProcedure, createTRPCRouter } from "~/server/api/trpc";

export const mailRouter = createTRPCRouter({
	resendReceipt: companyProcedure
		.input(resendReceiptSchema)
		.mutation(async ({ ctx, input }) => {
			const email = ctx.session.user.email;
			if (!email) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Aucune adresse e-mail n'est associée à votre compte pour envoyer l'accusé de réception.",
				});
			}

			const { sendReceipt } = await import("~/modules/mail/server");
			await sendReceipt({
				kind: input.kind,
				to: email,
				siren: ctx.siren,
				year: input.year,
				userId: ctx.session.user.id,
				isResend: true,
			});

			return { success: true, sentTo: email };
		}),
});
