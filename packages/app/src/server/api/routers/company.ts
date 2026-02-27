import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { buildDeclarationList } from "~/modules/my-space/buildDeclarationList";
import { computeDeclarationStatus } from "~/modules/my-space/declarationStatus";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { companies, declarations, userCompanies } from "~/server/db/schema";

const currentYear = new Date().getFullYear();

export const companyRouter = createTRPCRouter({
	list: protectedProcedure.query(async ({ ctx }) => {
		const userCompanyRows = await ctx.db
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
						eq(declarations.year, currentYear),
						inArray(declarations.siren, sirens),
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
		.input(z.object({ siren: z.string().length(9) }))
		.query(async ({ ctx, input }) => {
			// Verify the user has access to this company
			const userCompanyRow = await ctx.db
				.select()
				.from(userCompanies)
				.where(
					and(
						eq(userCompanies.userId, ctx.session.user.id),
						eq(userCompanies.siren, input.siren),
					),
				)
				.limit(1);

			if (userCompanyRow.length === 0) {
				throw new Error("Company not found or access denied");
			}

			// Fetch company details
			const companyRows = await ctx.db
				.select({
					siren: companies.siren,
					name: companies.name,
					address: companies.address,
					nafCode: companies.nafCode,
					workforce: companies.workforce,
					hasCse: companies.hasCse,
				})
				.from(companies)
				.where(eq(companies.siren, input.siren))
				.limit(1);

			const company = companyRows[0];
			if (!company) {
				throw new Error("Company not found");
			}

			// Fetch all declarations for this company, ordered by year desc
			const declarationRows = await ctx.db
				.select({
					siren: declarations.siren,
					year: declarations.year,
					status: declarations.status,
					currentStep: declarations.currentStep,
					updatedAt: declarations.updatedAt,
				})
				.from(declarations)
				.where(eq(declarations.siren, input.siren))
				.orderBy(desc(declarations.year));

			const declarationItems = buildDeclarationList(
				input.siren,
				declarationRows.map((d) => ({
					type: "remuneration" as const,
					year: d.year,
					status: computeDeclarationStatus({
						status: d.status,
						currentStep: d.currentStep,
					}),
					currentStep: d.currentStep ?? 0,
					updatedAt: d.updatedAt,
				})),
				currentYear,
			);

			return { company, declarations: declarationItems };
		}),
});
