import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";
import { AUDIT_ACTIONS } from "~/modules/audit";
import {
	declareRepresentationNotSubjectSchema,
	getRepresentationDeclarationSchema,
	getRepresentationWorkforceHistorySchema,
	saveRepresentationDraftSchema,
	submitRepresentationDeclarationSchema,
	submitRepresentationSchema,
} from "~/modules/declaration-representation/schemas";
import { TOTAL_REPRESENTATION_STEPS } from "~/modules/declaration-representation/types";
import {
	DEFAULT_LOCK_TIMEOUT_MINUTES,
	deriveExecutivesNotComputableReason,
	getCurrentDate,
	getRepresentationCampaignYear,
	isRepresentationCampaignOpen,
	isRepresentationDeclarationSubmitted,
	isRepresentationPublicationRequired,
} from "~/modules/domain";
import {
	companyProcedure,
	companyWriteProcedure,
	createTRPCRouter,
} from "~/server/api/trpc";
import { logAction } from "~/server/audit/log";
import { buildRequestContext } from "~/server/audit/requestContext";
import type { DB } from "~/server/db";
import { GLOBAL_SETTINGS_ID } from "~/server/db/getGlobalSettings";
import { getRepresentationCampaign } from "~/server/db/getRepresentationCampaign";
import { getRepresentationWorkforceHistory } from "~/server/db/getRepresentationWorkforceHistory";
import {
	globalSettings,
	representationDeclarations,
	users,
} from "~/server/db/schema";
import {
	acquireOrRefreshRepresentationLock,
	assertRepresentationLockHeld,
	getActiveRepresentationLock,
	RepresentationLockConflictError,
	refreshRepresentationLock,
	releaseRepresentationLock,
} from "~/server/services/representationDeclarationLockService";

const CAMPAIGN_CLOSED_MESSAGE =
	"La campagne de représentation équilibrée est close : la déclaration ne peut plus être modifiée.";
const ALREADY_SUBMITTED_MESSAGE =
	"La déclaration des écarts de représentation a déjà été transmise pour cette année.";

async function assertRepresentationCampaignOpen(year: number): Promise<void> {
	const campaign = await getRepresentationCampaign(
		getRepresentationCampaignYear(year),
	);
	if (!isRepresentationCampaignOpen(campaign, getCurrentDate())) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: CAMPAIGN_CLOSED_MESSAGE,
		});
	}
}

async function readLockTimeoutMinutes(db: DB): Promise<number> {
	const [settings] = await db
		.select({ minutes: globalSettings.declarationLockTimeoutMinutes })
		.from(globalSettings)
		.where(eq(globalSettings.id, GLOBAL_SETTINGS_ID))
		.limit(1);
	return settings?.minutes ?? DEFAULT_LOCK_TIMEOUT_MINUTES;
}

type Tx = Parameters<Parameters<DB["transaction"]>[0]>[0];

async function assertWriteLock(
	db: Tx,
	siren: string,
	year: number,
	userId: string,
): Promise<void> {
	try {
		await assertRepresentationLockHeld(db, siren, year, userId);
	} catch (error) {
		if (error instanceof RepresentationLockConflictError) {
			throw new TRPCError({ code: "CONFLICT", message: error.message });
		}
		throw error;
	}
}

export const representationDeclarationRouter = createTRPCRouter({
	getLockState: companyProcedure
		.input(getRepresentationDeclarationSchema)
		.query(async ({ ctx, input }) => {
			const holder = await getActiveRepresentationLock(
				ctx.db,
				ctx.siren,
				input.year,
			);
			return {
				locked: holder !== null,
				isOwnLock: holder?.userId === ctx.session.user.id,
				holder: holder
					? {
							firstName: holder.firstName,
							lastName: holder.lastName,
							email: holder.email,
							expiresAt: holder.expiresAt,
						}
					: null,
			};
		}),

	acquireLock: companyWriteProcedure
		.input(getRepresentationDeclarationSchema)
		.mutation(async ({ ctx, input }) => {
			await assertRepresentationCampaignOpen(input.year);
			const [declaration] = await ctx.db
				.select({ status: representationDeclarations.status })
				.from(representationDeclarations)
				.where(
					and(
						eq(representationDeclarations.siren, ctx.siren),
						eq(representationDeclarations.year, input.year),
					),
				)
				.limit(1);
			if (isRepresentationDeclarationSubmitted(declaration?.status)) {
				throw new TRPCError({
					code: "FORBIDDEN",
					message: ALREADY_SUBMITTED_MESSAGE,
				});
			}
			const timeoutMinutes = await readLockTimeoutMinutes(ctx.db);
			const result = await acquireOrRefreshRepresentationLock(
				ctx.db,
				ctx.siren,
				input.year,
				ctx.session.user.id,
				timeoutMinutes,
			);
			if (result.acquired) {
				const requestContext = buildRequestContext(ctx.headers);
				void logAction({
					action: AUDIT_ACTIONS.DECLARATION_LOCK_ACQUIRED,
					status: "success",
					userId: ctx.session.user.id,
					userEmail: ctx.session.user.email,
					siren: ctx.siren,
					resourceType: "representation_declaration",
					metadata: { year: input.year },
					ipAddress: requestContext.ipAddress,
					userAgent: requestContext.userAgent,
				});
			}
			return result;
		}),

	heartbeat: companyWriteProcedure
		.input(getRepresentationDeclarationSchema)
		.mutation(async ({ ctx, input }) => {
			const campaign = await getRepresentationCampaign(
				getRepresentationCampaignYear(input.year),
			);
			if (!isRepresentationCampaignOpen(campaign, new Date())) {
				return { held: false };
			}
			const timeoutMinutes = await readLockTimeoutMinutes(ctx.db);
			return {
				held: await refreshRepresentationLock(
					ctx.db,
					ctx.siren,
					input.year,
					ctx.session.user.id,
					timeoutMinutes,
				),
			};
		}),

	releaseLock: companyWriteProcedure
		.input(getRepresentationDeclarationSchema)
		.mutation(async ({ ctx, input }) => {
			const released = await releaseRepresentationLock(
				ctx.db,
				ctx.siren,
				input.year,
				ctx.session.user.id,
			);
			if (released) {
				const requestContext = buildRequestContext(ctx.headers);
				void logAction({
					action: AUDIT_ACTIONS.DECLARATION_LOCK_RELEASED,
					status: "success",
					userId: ctx.session.user.id,
					userEmail: ctx.session.user.email,
					siren: ctx.siren,
					resourceType: "representation_declaration",
					metadata: { year: input.year },
					ipAddress: requestContext.ipAddress,
					userAgent: requestContext.userAgent,
				});
			}
			return { released: true as const };
		}),

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
				campaignOpen: isRepresentationCampaignOpen(campaign, getCurrentDate()),
				declarationDeadline: campaign.declarationDeadline,
			};
		}),

	getDeclarant: companyProcedure
		.input(getRepresentationDeclarationSchema)
		.query(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select({
					firstName: users.firstName,
					lastName: users.lastName,
					email: users.email,
					phone: users.phone,
				})
				.from(representationDeclarations)
				.innerJoin(users, eq(representationDeclarations.declarantId, users.id))
				.where(
					and(
						eq(representationDeclarations.siren, ctx.siren),
						eq(representationDeclarations.year, input.year),
						eq(representationDeclarations.status, "submitted"),
					),
				)
				.limit(1);

			return rows[0] ?? null;
		}),

	getWorkforceHistory: companyProcedure
		.input(getRepresentationWorkforceHistorySchema)
		.query(({ ctx, input }) =>
			getRepresentationWorkforceHistory(ctx.siren, input.campaignYear),
		),

	saveDraft: companyWriteProcedure
		.input(saveRepresentationDraftSchema)
		.mutation(async ({ ctx, input }) => {
			const { siren } = ctx;
			const { year, draft, currentStep } = input;

			await assertRepresentationCampaignOpen(year);

			const now = new Date();
			const sharedColumns = {
				draft,
				draftUpdatedAt: now,
				currentStep,
				updatedAt: now,
			};
			const columns = {
				...sharedColumns,
				status: sql`CASE WHEN ${representationDeclarations.status} = 'not_subject' THEN 'draft' ELSE ${representationDeclarations.status} END`,
			};

			await ctx.db.transaction(async (tx) => {
				await assertWriteLock(tx, siren, year, ctx.session.user.id);
				await tx
					.insert(representationDeclarations)
					.values({
						siren,
						year,
						declarantId: ctx.session.user.id,
						status: "draft",
						...sharedColumns,
					})
					.onConflictDoUpdate({
						target: [
							representationDeclarations.siren,
							representationDeclarations.year,
						],
						set: columns,
					});
			});

			return { success: true as const };
		}),

	declareNotSubject: companyWriteProcedure
		.input(declareRepresentationNotSubjectSchema)
		.mutation(async ({ ctx, input }) => {
			const { siren } = ctx;
			const { year } = input;

			await assertRepresentationCampaignOpen(year);

			const now = new Date();
			const columns = {
				status: "not_subject" as const,
				currentStep: 0,
				draft: null,
				draftUpdatedAt: null,
				declarantId: ctx.session.user.id,
				updatedAt: now,
			};

			await ctx.db.transaction(async (tx) => {
				await assertWriteLock(tx, siren, year, ctx.session.user.id);
				// FOR UPDATE closes the TOCTOU race with a concurrent submit() on the same row.
				const existing = await tx
					.select({ status: representationDeclarations.status })
					.from(representationDeclarations)
					.where(
						and(
							eq(representationDeclarations.siren, siren),
							eq(representationDeclarations.year, year),
						),
					)
					.for("update")
					.limit(1);

				if (isRepresentationDeclarationSubmitted(existing[0]?.status)) {
					throw new TRPCError({
						code: "CONFLICT",
						message: ALREADY_SUBMITTED_MESSAGE,
					});
				}

				await tx
					.insert(representationDeclarations)
					.values({ siren, year, ...columns })
					.onConflictDoUpdate({
						target: [
							representationDeclarations.siren,
							representationDeclarations.year,
						],
						set: columns,
					});
				await releaseRepresentationLock(tx, siren, year, ctx.session.user.id);
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
				currentStep: TOTAL_REPRESENTATION_STEPS,
				submittedAt: now,
				updatedAt: now,
				draft: null,
				draftUpdatedAt: null,
			};

			await ctx.db.transaction(async (tx) => {
				await assertWriteLock(tx, siren, year, ctx.session.user.id);
				await tx
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
				await releaseRepresentationLock(tx, siren, year, ctx.session.user.id);
			});

			const email = ctx.session.user.email;
			if (email) {
				const { enqueueReceipt } = await import("~/modules/mail/server");
				await enqueueReceipt({
					kind: "representation",
					to: email,
					siren,
					year,
					userId: ctx.session.user.id,
					isResend: false,
				});
			}

			return { success: true as const };
		}),
});
