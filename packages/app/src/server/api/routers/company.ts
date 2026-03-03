import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { buildDeclarationList } from "~/modules/my-space/buildDeclarationList";
import { computeDeclarationStatus } from "~/modules/my-space/declarationStatus";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { companies, declarations, userCompanies } from "~/server/db/schema";

function getCurrentYear() {
	return new Date().getFullYear();
}

export const companyRouter = createTRPCRouter({
	get: protectedProcedure
		.input(z.object({ siren: z.string().length(9) }))
		.query(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select({
					siren: companies.siren,
					name: companies.name,
					address: companies.address,
					nafCode: companies.nafCode,
					workforce: companies.workforce,
					hasCse: companies.hasCse,
				})
				.from(userCompanies)
				.innerJoin(companies, eq(userCompanies.siren, companies.siren))
				.where(
					and(
						eq(userCompanies.userId, ctx.session.user.id),
						eq(userCompanies.siren, input.siren),
					),
				)
				.limit(1);

			const company = rows[0];
			if (!company) {
				throw new Error("Company not found or access denied");
			}

			return company;
		}),

	list: protectedProcedure.query(async ({ ctx }) => {
		const year = getCurrentYear();

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
					and(eq(declarations.year, year), inArray(declarations.siren, sirens)),
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
			const companyRows = await ctx.db
				.select({
					siren: companies.siren,
					name: companies.name,
					address: companies.address,
					nafCode: companies.nafCode,
					workforce: companies.workforce,
					hasCse: companies.hasCse,
				})
				.from(userCompanies)
				.innerJoin(companies, eq(userCompanies.siren, companies.siren))
				.where(
					and(
						eq(userCompanies.userId, ctx.session.user.id),
						eq(userCompanies.siren, input.siren),
					),
				)
				.limit(1);

			const company = companyRows[0];
			if (!company) {
				throw new Error("Company not found or access denied");
			}

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

			const year = getCurrentYear();
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
				year,
			);

			return { company, declarations: declarationItems };
		}),
});
