import { and, eq, inArray } from "drizzle-orm";

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
});
