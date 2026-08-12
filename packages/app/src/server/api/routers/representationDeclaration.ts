import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

import {
	getRepresentationDeclarationSchema,
	saveRepresentationDraftSchema,
	submitRepresentationDeclarationSchema,
	submitRepresentationSchema,
} from "~/modules/declaration-representation";
import {
	deriveExecutivesNotComputableReason,
	getRepresentationCampaignYear,
	isRepresentationCampaignOpen,
	isRepresentationPublicationRequired,
} from "~/modules/domain";
import {
	companyProcedure,
	companyWriteProcedure,
	createTRPCRouter,
} from "~/server/api/trpc";
import { getRepresentationCampaign } from "~/server/db/getRepresentationCampaign";
import { representationDeclarations } from "~/server/db/schema";

const CAMPAIGN_CLOSED_MESSAGE =
	"La campagne de représentation équilibrée est close : la déclaration ne peut plus être modifiée.";

async function assertRepresentationCampaignOpen(year: number): Promise<void> {
	const campaign = await getRepresentationCampaign(
		getRepresentationCampaignYear(year),
	);
	if (!isRepresentationCampaignOpen(campaign, new Date())) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: CAMPAIGN_CLOSED_MESSAGE,
		});
	}
}

export const representationDeclarationRouter = createTRPCRouter({
	get: companyProcedure
		.input(getRepresentationDeclarationSchema)
		.query(async ({ ctx, input }) => {
			const { siren } = ctx;
			const { year } = input;

			const rows = await ctx.db
				.select({
					id: representationDeclarations.id,
					siren: representationDeclarations.siren,
					year: representationDeclarations.year,
					declarantId: representationDeclarations.declarantId,
					referencePeriodStart: representationDeclarations.referencePeriodStart,
					referencePeriodEnd: representationDeclarations.referencePeriodEnd,
					executiveWomenPercent:
						representationDeclarations.executiveWomenPercent,
					executiveMenPercent: representationDeclarations.executiveMenPercent,
					notComputableReasonExecutives:
						representationDeclarations.notComputableReasonExecutives,
					memberWomenPercent: representationDeclarations.memberWomenPercent,
					memberMenPercent: representationDeclarations.memberMenPercent,
					notComputableReasonMembers:
						representationDeclarations.notComputableReasonMembers,
					publishDate: representationDeclarations.publishDate,
					publishUrl: representationDeclarations.publishUrl,
					publishModalities: representationDeclarations.publishModalities,
					currentStep: representationDeclarations.currentStep,
					status: representationDeclarations.status,
					submittedAt: representationDeclarations.submittedAt,
					draft: representationDeclarations.draft,
					draftUpdatedAt: representationDeclarations.draftUpdatedAt,
					createdAt: representationDeclarations.createdAt,
					updatedAt: representationDeclarations.updatedAt,
				})
				.from(representationDeclarations)
				.where(
					and(
						eq(representationDeclarations.siren, siren),
						eq(representationDeclarations.year, year),
					),
				)
				.limit(1);

			const campaign = await getRepresentationCampaign(
				getRepresentationCampaignYear(year),
			);

			return {
				declaration: rows[0] ?? null,
				campaignOpen: isRepresentationCampaignOpen(campaign, new Date()),
			};
		}),

	saveDraft: companyWriteProcedure
		.input(saveRepresentationDraftSchema)
		.mutation(async ({ ctx, input }) => {
			const { siren } = ctx;
			const { year, draft, currentStep } = input;

			await assertRepresentationCampaignOpen(year);

			const now = new Date();
			const columns = {
				draft,
				draftUpdatedAt: now,
				currentStep,
				updatedAt: now,
			};

			await ctx.db
				.insert(representationDeclarations)
				.values({
					siren,
					year,
					declarantId: ctx.session.user.id,
					status: "draft",
					...columns,
				})
				.onConflictDoUpdate({
					target: [
						representationDeclarations.siren,
						representationDeclarations.year,
					],
					set: columns,
				});

			return { success: true as const };
		}),

	submit: companyWriteProcedure
		.input(submitRepresentationDeclarationSchema)
		.mutation(async ({ ctx, input }) => {
			const { siren } = ctx;
			const { year } = input;

			await assertRepresentationCampaignOpen(year);

			const parsed = submitRepresentationSchema(year).safeParse(input.payload);
			if (!parsed.success) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: parsed.error.issues[0]?.message ?? "Déclaration invalide.",
					cause: parsed.error,
				});
			}
			const payload = parsed.data;

			const publicationRequired = isRepresentationPublicationRequired(
				payload.executivesCount,
				payload.hasManagementBody,
			);

			const now = new Date();
			const columns = {
				referencePeriodStart: payload.referencePeriodStart,
				referencePeriodEnd: payload.referencePeriodEnd,
				executiveWomenPercent:
					payload.executivesCount === "two_or_more"
						? String(payload.executiveWomenPercent)
						: null,
				executiveMenPercent:
					payload.executivesCount === "two_or_more"
						? String(payload.executiveMenPercent)
						: null,
				notComputableReasonExecutives: deriveExecutivesNotComputableReason(
					payload.executivesCount,
				),
				memberWomenPercent: payload.hasManagementBody
					? String(payload.memberWomenPercent)
					: null,
				memberMenPercent: payload.hasManagementBody
					? String(payload.memberMenPercent)
					: null,
				notComputableReasonMembers: payload.hasManagementBody
					? null
					: ("aucune_instance_dirigeante" as const),
				publishDate: publicationRequired ? (payload.publishDate ?? null) : null,
				publishUrl:
					publicationRequired && payload.hasWebsite === true
						? (payload.publishUrl ?? null)
						: null,
				publishModalities:
					publicationRequired && payload.hasWebsite === false
						? (payload.publishModalities ?? null)
						: null,
				status: "submitted" as const,
				submittedAt: now,
				updatedAt: now,
				draft: null,
				draftUpdatedAt: null,
			};

			await ctx.db
				.insert(representationDeclarations)
				.values({
					siren,
					year,
					declarantId: ctx.session.user.id,
					...columns,
				})
				.onConflictDoUpdate({
					target: [
						representationDeclarations.siren,
						representationDeclarations.year,
					],
					set: columns,
				});

			return { success: true as const };
		}),
});
