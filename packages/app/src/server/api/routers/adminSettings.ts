import { eq } from "drizzle-orm";

import {
	campaignDeadlinesFormSchema,
	getCampaignDeadlinesByYearSchema,
	setActiveYearSchema,
} from "~/modules/admin/settings/schemas";
import { getDefaultCampaignDeadlines } from "~/modules/domain";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { GLOBAL_SETTINGS_ID } from "~/server/db/getGlobalSettings";
import { campaignDeadlines, globalSettings } from "~/server/db/schema";

/**
 * Admin / settings router — edits platform-wide global variables.
 *
 * Two distinct scopes:
 * - per-year campaign deadlines (`campaignDeadlines` table)
 * - singleton global settings (`globalSettings` table, active campaign year)
 *
 * All procedures are gated by `adminProcedure`.
 */
export const adminSettingsRouter = createTRPCRouter({
	/**
	 * Returns the active campaign year (configured in the backoffice) and the
	 * list of years for which deadlines have already been defined in the DB.
	 */
	getOverview: adminProcedure.query(async ({ ctx }) => {
		const [settingsRow] = await ctx.db
			.select({ activeCampaignYear: globalSettings.activeCampaignYear })
			.from(globalSettings)
			.limit(1);

		const yearRows = await ctx.db
			.select({ year: campaignDeadlines.year })
			.from(campaignDeadlines)
			.orderBy(campaignDeadlines.year);

		return {
			activeCampaignYear: settingsRow?.activeCampaignYear ?? null,
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

	/**
	 * Upsert all deadlines of a given campaign year in one call.
	 */
	upsertCampaignDeadlines: adminProcedure
		.input(campaignDeadlinesFormSchema)
		.mutation(async ({ ctx, input }) => {
			const values = {
				year: input.year,
				gipPublicationDate: input.gipPublicationDate,
				campaignStartDate: input.campaignStartDate,
				decl1ModificationDeadline: input.decl1ModificationDeadline,
				decl1JustificationDeadline: input.decl1JustificationDeadline,
				decl1JointEvaluationDeadline: input.decl1JointEvaluationDeadline,
				decl2ModificationDeadline: input.decl2ModificationDeadline,
				decl2JustificationDeadline: input.decl2JustificationDeadline,
				decl2JointEvaluationDeadline: input.decl2JointEvaluationDeadline,
			};

			await ctx.db.insert(campaignDeadlines).values(values).onConflictDoUpdate({
				target: campaignDeadlines.year,
				set: values,
			});

			return { success: true as const };
		}),

	/**
	 * Sets the single "active campaign year" used across the platform.
	 */
	setActiveCampaignYear: adminProcedure
		.input(setActiveYearSchema)
		.mutation(async ({ ctx, input }) => {
			await ctx.db
				.insert(globalSettings)
				.values({
					id: GLOBAL_SETTINGS_ID,
					activeCampaignYear: input.activeCampaignYear,
					updatedAt: new Date(),
					updatedBy: ctx.session.user.id,
				})
				.onConflictDoUpdate({
					target: globalSettings.id,
					set: {
						activeCampaignYear: input.activeCampaignYear,
						updatedAt: new Date(),
						updatedBy: ctx.session.user.id,
					},
				});

			return { success: true as const };
		}),
});

/** Format a non-null Date as a YYYY-MM-DD string. */
function toIsoDate(date: Date): string {
	const y = date.getUTCFullYear();
	const m = String(date.getUTCMonth() + 1).padStart(2, "0");
	const d = String(date.getUTCDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

/** Format an optional Date as a YYYY-MM-DD string or null. */
function toNullableIsoDate(date: Date | null): string | null {
	return date ? toIsoDate(date) : null;
}
