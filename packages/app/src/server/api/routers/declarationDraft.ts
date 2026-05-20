import { TRPCError } from "@trpc/server";
import { and, eq, isNull } from "drizzle-orm";
import type { Session } from "next-auth";

import {
	clearDraftInput,
	getDraftInput,
	saveDraftInput,
} from "~/modules/declaration-remuneration/shared/draft/schemas";
import { getDefaultCampaignDeadlines } from "~/modules/domain";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { isImpersonatingSiren } from "~/server/auth/companyAccess";
import type { DB } from "~/server/db";
import { declarations, userCompanies } from "~/server/db/schema";

const DRAFT_TTL_MS = 30 * 24 * 3600 * 1000;

type DraftBlob = Record<string, Record<string, unknown>>;

async function assertOwnership(
	db: DB,
	session: Session,
	siren: string,
): Promise<void> {
	if (isImpersonatingSiren(session, siren)) return;

	const userId = session.user.id;
	const rows = await db
		.select({ siren: userCompanies.siren })
		.from(userCompanies)
		.where(
			and(eq(userCompanies.userId, userId), eq(userCompanies.siren, siren)),
		)
		.limit(1);

	if (!rows[0]) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: "Accès refusé à ce SIREN.",
		});
	}
}

function isDraftExpired(draftUpdatedAt: Date, year: number): boolean {
	const now = Date.now();
	if (now - draftUpdatedAt.getTime() > DRAFT_TTL_MS) return true;
	const deadline = getDefaultCampaignDeadlines(year).decl1ModificationDeadline;
	return now > deadline.getTime();
}

export const declarationDraftRouter = createTRPCRouter({
	get: protectedProcedure.input(getDraftInput).query(async ({ ctx, input }) => {
		const { siren, year } = input;

		if (ctx.session.user.isAdmin && ctx.session.user.impersonation) {
			return null;
		}

		await assertOwnership(ctx.db, ctx.session, siren);

		const rows = await ctx.db
			.select({
				draft: declarations.draft,
				draftUpdatedAt: declarations.draftUpdatedAt,
			})
			.from(declarations)
			.where(
				and(
					eq(declarations.siren, siren),
					eq(declarations.year, year),
					isNull(declarations.cancelledAt),
				),
			)
			.limit(1);

		const row = rows[0];
		if (!row || row.draft === null || row.draftUpdatedAt === null) return null;

		if (isDraftExpired(row.draftUpdatedAt, year)) return null;

		return row.draft as DraftBlob;
	}),

	save: protectedProcedure
		.input(saveDraftInput)
		.mutation(async ({ ctx, input }) => {
			const { siren, year, slice } = input;

			if (ctx.session.user.isAdmin && ctx.session.user.impersonation) {
				return { ok: true as const };
			}

			await assertOwnership(ctx.db, ctx.session, siren);

			const rows = await ctx.db
				.select({ draft: declarations.draft })
				.from(declarations)
				.where(
					and(
						eq(declarations.siren, siren),
						eq(declarations.year, year),
						isNull(declarations.cancelledAt),
					),
				)
				.limit(1);

			const existing = rows[0];
			const currentDraft = (existing?.draft ?? {}) as DraftBlob;
			const kindData = (currentDraft[slice.kind] ?? {}) as Record<
				string,
				unknown
			>;
			const newDraft: DraftBlob = {
				...currentDraft,
				[slice.kind]: { ...kindData, [slice.step]: slice.data },
			};
			const now = new Date();

			if (existing) {
				await ctx.db
					.update(declarations)
					.set({ draft: newDraft, draftUpdatedAt: now })
					.where(
						and(
							eq(declarations.siren, siren),
							eq(declarations.year, year),
							isNull(declarations.cancelledAt),
						),
					);
			} else {
				await ctx.db.insert(declarations).values({
					siren,
					year,
					declarantId: ctx.session.user.id,
					draft: newDraft,
					draftUpdatedAt: now,
				});
			}

			return { ok: true as const };
		}),

	clear: protectedProcedure
		.input(clearDraftInput)
		.mutation(async ({ ctx, input }) => {
			const { siren, year, kind } = input;

			if (ctx.session.user.isAdmin && ctx.session.user.impersonation) {
				return { ok: true as const };
			}

			await assertOwnership(ctx.db, ctx.session, siren);

			const where = and(
				eq(declarations.siren, siren),
				eq(declarations.year, year),
				isNull(declarations.cancelledAt),
			);

			if (kind === undefined) {
				await ctx.db
					.update(declarations)
					.set({ draft: null, draftUpdatedAt: null })
					.where(where);
			} else {
				const rows = await ctx.db
					.select({ draft: declarations.draft })
					.from(declarations)
					.where(where)
					.limit(1);

				const row = rows[0];
				if (!row || row.draft === null) return { ok: true as const };

				const current = row.draft as DraftBlob;
				const { [kind]: _removed, ...remaining } = current;

				const isEmpty = Object.keys(remaining).length === 0;
				await ctx.db
					.update(declarations)
					.set({
						draft: isEmpty ? null : remaining,
						draftUpdatedAt: isEmpty ? null : new Date(),
					})
					.where(where);
			}

			return { ok: true as const };
		}),
});
