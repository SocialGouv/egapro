import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import type { Session } from "next-auth";
import { computeDeclarationStatus, getCurrentYear } from "~/modules/domain";
import { buildDeclarationList } from "~/modules/my-space/buildDeclarationList";
import {
	sirenInputSchema,
	updateHasCseSchema,
} from "~/modules/my-space/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
	assertNotImpersonating,
	isImpersonatingSiren,
} from "~/server/auth/companyAccess";
import type { DB } from "~/server/db";
import {
	companies,
	declarations,
	files,
	gipMdsData,
	userCompanies,
} from "~/server/db/schema";
import { fetchCseBySiren, fetchSanctionBySiren } from "~/server/services/suit";

async function findUserCompany(db: DB, session: Session, siren: string) {
	const userId = session.user.id;
	const bypassOwnership = isImpersonatingSiren(session, siren);

	const baseQuery = db
		.select({
			siren: companies.siren,
			name: companies.name,
			address: companies.address,
			nafCode: companies.nafCode,
			workforce: companies.workforce,
			hasCse: companies.hasCse,
		})
		.from(companies);

	const rows = bypassOwnership
		? await baseQuery.where(eq(companies.siren, siren)).limit(1)
		: await baseQuery
				.innerJoin(userCompanies, eq(userCompanies.siren, companies.siren))
				.where(
					and(eq(userCompanies.userId, userId), eq(userCompanies.siren, siren)),
				)
				.limit(1);

	const company = rows[0];
	if (!company) {
		throw new Error("Company not found or access denied");
	}

	if (company.hasCse === null) {
		const hasCse = await fetchCseBySiren(company.siren);
		if (hasCse !== null) {
			await db
				.update(companies)
				.set({ hasCse })
				.where(eq(companies.siren, company.siren));
			company.hasCse = hasCse;
		}
	}

	return company;
}

export const companyRouter = createTRPCRouter({
	get: protectedProcedure
		.input(sirenInputSchema)
		.query(({ ctx, input }) =>
			findUserCompany(ctx.db, ctx.session, input.siren),
		),

	list: protectedProcedure.query(async ({ ctx }) => {
		const year = getCurrentYear();

		const impersonation = ctx.session.user.isAdmin
			? ctx.session.user.impersonation
			: null;

		// When impersonating, the admin's "my space" shows only the
		// impersonated company — not the admin's own referent companies.
		const userCompanyRows = impersonation
			? await ctx.db
					.select({ siren: companies.siren, name: companies.name })
					.from(companies)
					.where(eq(companies.siren, impersonation.siren))
			: await ctx.db
					.select({
						siren: companies.siren,
						name: companies.name,
					})
					.from(userCompanies)
					.innerJoin(companies, eq(userCompanies.siren, companies.siren))
					.where(eq(userCompanies.userId, ctx.session.user.id));

		const sirens = userCompanyRows.map((r) => r.siren);

		const declarationMap = new Map<
			string,
			{ status: string | null; currentStep: number | null }
		>();

		if (sirens.length > 0) {
			const decls = await ctx.db
				.select({
					siren: declarations.siren,
					status: declarations.status,
					currentStep: declarations.currentStep,
				})
				.from(declarations)
				.where(
					and(
						eq(declarations.year, year),
						inArray(declarations.siren, sirens),
						isNull(declarations.cancelledAt),
					),
				);

			for (const d of decls) {
				declarationMap.set(d.siren, {
					status: d.status,
					currentStep: d.currentStep,
				});
			}
		}

		return userCompanyRows.map((company) => ({
			siren: company.siren,
			name: company.name,
			declarationStatus: computeDeclarationStatus(
				declarationMap.get(company.siren),
			),
		}));
	}),

	getWithDeclarations: protectedProcedure
		.input(sirenInputSchema)
		.query(async ({ ctx, input }) => {
			const company = await findUserCompany(ctx.db, ctx.session, input.siren);

			const [declarationRows, jointEvalRows, prefillRows] = await Promise.all([
				ctx.db
					.select({
						siren: declarations.siren,
						year: declarations.year,
						status: declarations.status,
						currentStep: declarations.currentStep,
						updatedAt: declarations.updatedAt,
						firstDeclarationPathChoice: declarations.firstDeclarationPathChoice,
						secondDeclarationSubmittedAt:
							declarations.secondDeclarationSubmittedAt,
						demarcheCompletedAt: declarations.demarcheCompletedAt,
						cseOpinionCompletedAt: declarations.cseOpinionCompletedAt,
					})
					.from(declarations)
					.where(
						and(
							eq(declarations.siren, input.siren),
							isNull(declarations.cancelledAt),
						),
					)
					.orderBy(desc(declarations.year)),
				ctx.db
					.select({ year: declarations.year })
					.from(files)
					.innerJoin(declarations, eq(files.declarationId, declarations.id))
					.where(
						and(
							eq(declarations.siren, input.siren),
							eq(files.type, "joint_evaluation"),
						),
					),
				ctx.db
					.select({ year: gipMdsData.year })
					.from(gipMdsData)
					.where(eq(gipMdsData.siren, input.siren)),
			]);

			const yearsWithJointEval = new Set(jointEvalRows.map((r) => r.year));
			const yearsWithPrefill = new Set(prefillRows.map((r) => r.year));

			const year = getCurrentYear();
			const mappedDeclarations = declarationRows.map((d) => ({
				type: "remuneration" as const,
				year: d.year,
				status: computeDeclarationStatus({
					status: d.status,
					currentStep: d.currentStep,
				}),
				currentStep: d.currentStep ?? 0,
				updatedAt: d.updatedAt,
				firstDeclarationPathChoice: d.firstDeclarationPathChoice,
				secondDeclarationSubmittedAt: d.secondDeclarationSubmittedAt,
				demarcheCompletedAt: d.demarcheCompletedAt,
				cseOpinionCompletedAt: d.cseOpinionCompletedAt,
				hasJointEvaluationFile: yearsWithJointEval.has(d.year),
				hasPrefillData: yearsWithPrefill.has(d.year),
			}));

			const declarationItems = buildDeclarationList(
				input.siren,
				mappedDeclarations,
				year,
				yearsWithPrefill,
			);

			return { company, declarations: declarationItems };
		}),

	updateHasCse: protectedProcedure
		.input(updateHasCseSchema)
		.mutation(async ({ ctx, input }) => {
			assertNotImpersonating(ctx.session);
			await findUserCompany(ctx.db, ctx.session, input.siren);
			await ctx.db
				.update(companies)
				.set({ hasCse: input.hasCse })
				.where(eq(companies.siren, input.siren));
		}),

	getSanctionStatus: protectedProcedure
		.input(sirenInputSchema)
		.query(async ({ ctx, input }) => {
			await findUserCompany(ctx.db, ctx.session, input.siren);
			const result = await fetchSanctionBySiren(input.siren);
			return result ?? { hasSanction: false, validityDate: null };
		}),
});
