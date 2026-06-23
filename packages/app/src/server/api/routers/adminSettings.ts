import { eq } from "drizzle-orm";

import {
	campaignDeadlinesFormSchema,
	getCampaignDeadlinesByYearSchema,
	updateLockTimeoutSchema,
} from "~/modules/admin/settings/schemas";
import {
	DEFAULT_LOCK_TIMEOUT_MINUTES,
	getDefaultCampaignDeadlines,
} from "~/modules/domain";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { campaignDeadlines, globalSettings } from "~/server/db/schema";

/**
 * Admin / settings router — edits platform-wide global variables.
 *
 * Scope: per-year campaign deadlines (`campaignDeadlines` table). The active
 * campaign year is deduced from those rows (latest `campaignStartDate <= today`)
 * and the GIP publication date is written by the SUIT CSV import, so neither
 * are edited here.
 *
 * All procedures are gated by `adminProcedure`.
 */
export const adminSettingsRouter = createTRPCRouter({
	/**
	 * Returns the list of years for which deadlines have already been defined.
	 */
	getOverview: adminProcedure.query(async ({ ctx }) => {
		const yearRows = await ctx.db
			.select({ year: campaignDeadlines.year })
			.from(campaignDeadlines)
			.orderBy(campaignDeadlines.year);

		return {
			configuredYears: yearRows.map((r) => r.year),
		};
	}),

	/**
	 * Returns the campaign deadlines stored for a given year, or the
	 * hardcoded defaults if no row exists yet.
	 */
	getDeadlinesByYear: adminProcedure
		.input(getCampaignDeadlinesByYearSchema)
		.query(async ({ ctx, input }) => {
			const [row] = await ctx.db
				.select()
				.from(campaignDeadlines)
				.where(eq(campaignDeadlines.year, input.year))
				.limit(1);

			if (row) {
				return {
					year: row.year,
					exists: true as const,
					gipPublicationDate: row.gipPublicationDate,
					campaignStartDate: row.campaignStartDate,
					decl1ModificationDeadline: row.decl1ModificationDeadline,
					decl1JustificationDeadline: row.decl1JustificationDeadline,
					decl1JointEvaluationDeadline: row.decl1JointEvaluationDeadline,
					decl2ModificationDeadline: row.decl2ModificationDeadline,
					decl2JustificationDeadline: row.decl2JustificationDeadline,
					decl2JointEvaluationDeadline: row.decl2JointEvaluationDeadline,
				};
			}

			const defaults = getDefaultCampaignDeadlines(input.year);
			return {
				year: input.year,
				exists: false as const,
				gipPublicationDate: toNullableIsoDate(defaults.gipPublicationDate),
				campaignStartDate: toNullableIsoDate(defaults.campaignStartDate),
				decl1ModificationDeadline: toIsoDate(
					defaults.decl1ModificationDeadline,
				),
				decl1JustificationDeadline: toIsoDate(
					defaults.decl1JustificationDeadline,
				),
				decl1JointEvaluationDeadline: toIsoDate(
					defaults.decl1JointEvaluationDeadline,
				),
				decl2ModificationDeadline: toIsoDate(
					defaults.decl2ModificationDeadline,
				),
				decl2JustificationDeadline: toIsoDate(
					defaults.decl2JustificationDeadline,
				),
				decl2JointEvaluationDeadline: toIsoDate(
					defaults.decl2JointEvaluationDeadline,
				),
			};
		}),

	getLockTimeout: adminProcedure.query(async ({ ctx }) => {
		const [row] = await ctx.db
			.select({
				declarationLockTimeoutMinutes:
					globalSettings.declarationLockTimeoutMinutes,
			})
			.from(globalSettings)
			.where(eq(globalSettings.id, 1))
			.limit(1);

		return {
			timeoutMinutes:
				row?.declarationLockTimeoutMinutes ?? DEFAULT_LOCK_TIMEOUT_MINUTES,
		};
	}),

	updateLockTimeout: adminProcedure
		.input(updateLockTimeoutSchema)
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.update(globalSettings)
				.set({
					declarationLockTimeoutMinutes: input.timeoutMinutes,
					updatedAt: new Date(),
					updatedBy: ctx.session.user.id,
				})
				.where(eq(globalSettings.id, 1));

			return { success: true as const };
		}),

	/**
	 * Upsert all deadlines of a given campaign year in one call.
	 *
	 * `gipPublicationDate` is deliberately excluded from the payload — its value
	 * is written by the SUIT CSV import and the admin form only displays it.
	 */
	upsertCampaignDeadlines: adminProcedure
		.input(campaignDeadlinesFormSchema)
		.mutation(async ({ ctx, input }) => {
			const values = {
				year: input.year,
				campaignStartDate: input.campaignStartDate,
				decl1ModificationDeadline: input.decl1ModificationDeadline,
				decl1JustificationDeadline: input.decl1JustificationDeadline,
				decl1JointEvaluationDeadline: input.decl1JointEvaluationDeadline,
				decl2ModificationDeadline: input.decl2ModificationDeadline,
				decl2JustificationDeadline: input.decl2JustificationDeadline,
				decl2JointEvaluationDeadline: input.decl2JointEvaluationDeadline,
			};

			// `gipPublicationDate` is written exclusively by the SUIT CSV import,
			// so we never touch it here — neither on insert (defaults to NULL)
			// nor on conflict (the `set` object below omits it by construction).
			await ctx.db.insert(campaignDeadlines).values(values).onConflictDoUpdate({
				target: campaignDeadlines.year,
				set: values,
			});

			return { success: true as const };
		}),
});

/** Format a non-null Date as a local-date YYYY-MM-DD string. */
function toIsoDate(date: Date): string {
	// Shift by the local TZ offset so toISOString renders the local date, not UTC.
	const localMs = date.getTime() - date.getTimezoneOffset() * 60_000;
	return new Date(localMs).toISOString().slice(0, 10);
}

/** Format an optional Date as a YYYY-MM-DD string or null. */
function toNullableIsoDate(date: Date | null): string | null {
	return date ? toIsoDate(date) : null;
}
