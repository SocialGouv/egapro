import { and, desc, eq, inArray } from "drizzle-orm";
import { computeDeclarationStatus, getCurrentYear } from "~/modules/domain";
import { buildDeclarationList } from "~/modules/my-space/buildDeclarationList";
import {
	sirenInputSchema,
	updateHasCseSchema,
} from "~/modules/my-space/schemas";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { DB } from "~/server/db";
import { companies, declarations, userCompanies } from "~/server/db/schema";
import { fetchCseBySiren } from "~/server/services/suit";

async function findUserCompany(db: DB, userId: string, siren: string) {
	const rows = await db
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
			findUserCompany(ctx.db, ctx.session.user.id, input.siren),
		),

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
		.input(sirenInputSchema)
		.query(async ({ ctx, input }) => {
			const company = await findUserCompany(
				ctx.db,
				ctx.session.user.id,
				input.siren,
			);

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

	updateHasCse: protectedProcedure
		.input(updateHasCseSchema)
		.mutation(async ({ ctx, input }) => {
			await findUserCompany(ctx.db, ctx.session.user.id, input.siren);
			await ctx.db
				.update(companies)
				.set({ hasCse: input.hasCse })
				.where(eq(companies.siren, input.siren));
		}),
});
