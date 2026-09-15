import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull } from "drizzle-orm";
import type { Session } from "next-auth";
import {
	applyDeclarationClosure,
	computeDeclarationStatus,
	computeRepresentationDeclarationStatus,
	getCurrentDate,
	getCurrentYear,
	getObligationWorkforce,
	getReferenceYearFor,
	isCseRequired,
	isPresumedSubjectToRepresentation,
	isRepresentationNotSubject,
	parseGipWorkforce,
} from "~/modules/domain";
import {
	buildDeclarationList,
	type DbDeclaration,
} from "~/modules/my-space/buildDeclarationList";
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
import { getCampaignDeadlines } from "~/server/db/getCampaignDeadlines";
import { getRepresentationWorkforceHistory } from "~/server/db/getRepresentationWorkforceHistory";
import {
	companies,
	declarationStatusHistory,
	declarations,
	files,
	gipMdsData,
	representationDeclarations,
	userCompanies,
} from "~/server/db/schema";
import { syncCseRequirement } from "~/server/services/cseRequirementSync";
import { fetchCseBySiren } from "~/server/services/suit";
import { fetchCompanyBySiren } from "~/server/services/weez";

async function findUserCompany(db: DB, session: Session, siren: string) {
	const userId = session.user.id;
	const bypassOwnership = isImpersonatingSiren(session, siren);

	const baseQuery = db
		.select({
			siren: companies.siren,
			name: companies.name,
			address: companies.address,
			nafCode: companies.nafCode,
			nafLabel: companies.nafLabel,
			countryCode: companies.countryCode,
			countryLabel: companies.countryLabel,
			workforceEma: gipMdsData.workforceEma,
			hasCse: companies.hasCse,
		})
		.from(companies)
		.leftJoin(
			gipMdsData,
			and(
				eq(gipMdsData.siren, companies.siren),
				eq(gipMdsData.year, getCurrentYear()),
			),
		);

	const rows = bypassOwnership
		? await baseQuery.where(eq(companies.siren, siren)).limit(1)
		: await baseQuery
				.innerJoin(userCompanies, eq(userCompanies.siren, companies.siren))
				.where(
					and(eq(userCompanies.userId, userId), eq(userCompanies.siren, siren)),
				)
				.limit(1);

	const row = rows[0];
	if (!row) {
		throw new Error("Company not found or access denied");
	}

	const { workforceEma, ...rest } = row;
	const company = {
		...rest,
		gipWorkforce: parseGipWorkforce(workforceEma),
	};

	// Below 100 the CSE field is out of scope entirely, so `hasCse` stays null.
	if (
		company.hasCse === null &&
		isCseRequired(getObligationWorkforce(company.gipWorkforce))
	) {
		const hasCse = await fetchCseBySiren(company.siren);
		if (hasCse !== null) {
			await db
				.update(companies)
				.set({ hasCse })
				.where(eq(companies.siren, company.siren));
			company.hasCse = hasCse;
		}
	}

	// Backfill the NAF pair from Weez when the label is missing — owner reads
	// only (impersonation stays read-only); best-effort, never breaks the read.
	// Code and label are written together: a stored code may predate the rév. 2
	// switch (#4087), and writing the label alone would pin a rév. 2 wording
	// next to a NAF 2025 code.
	if (
		!bypassOwnership &&
		company.nafCode !== null &&
		company.nafLabel === null
	) {
		try {
			const info = await fetchCompanyBySiren(company.siren);
			if (info?.nafLabel && info.nafCode) {
				await db
					.update(companies)
					.set({ nafCode: info.nafCode, nafLabel: info.nafLabel })
					.where(eq(companies.siren, company.siren));
				company.nafCode = info.nafCode;
				company.nafLabel = info.nafLabel;
			}
		} catch {
			// keep the cached code-only display when Weez is unavailable
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

	getWithDeclarations: protectedProcedure
		.input(sirenInputSchema)
		.query(async ({ ctx, input }) => {
			const company = await findUserCompany(ctx.db, ctx.session, input.siren);
			const year = getCurrentYear();

			const [
				declarationRows,
				jointEvalRows,
				prefillRows,
				eventRows,
				representationWorkforceHistory,
				currentYearRepresentationDeclarationRows,
			] = await Promise.all([
				ctx.db
					.select({
						id: declarations.id,
						siren: declarations.siren,
						year: declarations.year,
						status: declarations.status,
						currentStep: declarations.currentStep,
						updatedAt: declarations.updatedAt,
						firstDeclarationPathChoice: declarations.firstDeclarationPathChoice,
						secondDeclarationPathChoice:
							declarations.secondDeclarationPathChoice,
						cseRequired: declarations.cseRequired,
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
				ctx.db
					.select({
						declarationId: declarationStatusHistory.declarationId,
						eventType: declarationStatusHistory.eventType,
					})
					.from(declarationStatusHistory)
					.innerJoin(
						declarations,
						eq(declarationStatusHistory.declarationId, declarations.id),
					)
					.where(
						and(
							eq(declarations.siren, input.siren),
							isNull(declarations.cancelledAt),
						),
					),
				getRepresentationWorkforceHistory(input.siren, year),
				ctx.db
					.select({
						status: representationDeclarations.status,
						currentStep: representationDeclarations.currentStep,
						updatedAt: representationDeclarations.updatedAt,
					})
					.from(representationDeclarations)
					.where(
						and(
							eq(representationDeclarations.siren, input.siren),
							// The représentation funnel stores the *reference* year, not the campaign year.
							eq(representationDeclarations.year, getReferenceYearFor(year)),
						),
					)
					.limit(1),
			]);

			const yearsWithJointEval = new Set(jointEvalRows.map((r) => r.year));
			const yearsWithPrefill = new Set(prefillRows.map((r) => r.year));
			const declarationIdsWithSecondDecl = new Set(
				eventRows
					.filter((r) => r.eventType === "second_declaration_submit")
					.map((r) => r.declarationId),
			);
			const declarationIdsWithCseOpinion = new Set(
				eventRows
					.filter((r) => r.eventType === "cse_opinion_submit")
					.map((r) => r.declarationId),
			);

			const pastYears = [
				...new Set(
					declarationRows.filter((d) => d.year < year).map((d) => d.year),
				),
			];
			const pastYearDeadlines = await Promise.all(
				pastYears.map((pastYear) => getCampaignDeadlines(pastYear)),
			);
			const deadlinesByYear = new Map(
				pastYears.map((pastYear, index) => [
					pastYear,
					pastYearDeadlines[index],
				]),
			);

			const representationRow = currentYearRepresentationDeclarationRows[0];
			const representationVisible =
				representationRow !== undefined ||
				isPresumedSubjectToRepresentation(representationWorkforceHistory, year);
			const mappedDeclarations: DbDeclaration[] = declarationRows.map((d) => {
				const projectedStatus = computeDeclarationStatus({
					status: d.status,
					currentStep: d.currentStep,
				});
				const deadlines = deadlinesByYear.get(d.year);
				const status = deadlines
					? applyDeclarationClosure({
							status: projectedStatus,
							fsmStatus: d.status,
							year: d.year,
							currentYear: year,
							deadlines,
							// Same clock as `currentYear` above: left to its default the deadline check would read the wall clock and contradict the year guard.
							now: getCurrentDate(),
						})
					: projectedStatus;
				return {
					type: "remuneration" as const,
					year: d.year,
					status,
					fsmStatus: d.status,
					currentStep: d.currentStep ?? 0,
					updatedAt: d.updatedAt,
					firstDeclarationPathChoice: d.firstDeclarationPathChoice,
					secondDeclarationPathChoice: d.secondDeclarationPathChoice,
					hasSubmittedSecondDeclaration: declarationIdsWithSecondDecl.has(d.id),
					hasSubmittedCseOpinion: declarationIdsWithCseOpinion.has(d.id),
					cseRequired: d.cseRequired,
					hasJointEvaluationFile: yearsWithJointEval.has(d.year),
					hasPrefillData: yearsWithPrefill.has(d.year),
					notSubject: false,
				};
			});

			if (representationRow) {
				const representationCurrentStep = representationRow.currentStep ?? 0;
				mappedDeclarations.push({
					type: "representation" as const,
					year,
					status: computeRepresentationDeclarationStatus({
						status: representationRow.status,
						currentStep: representationRow.currentStep,
					}),
					fsmStatus: null,
					currentStep: representationCurrentStep,
					updatedAt: representationRow.updatedAt,
					firstDeclarationPathChoice: null,
					secondDeclarationPathChoice: null,
					hasSubmittedSecondDeclaration: false,
					hasSubmittedCseOpinion: false,
					cseRequired: false,
					hasJointEvaluationFile: false,
					hasPrefillData: false,
					notSubject: isRepresentationNotSubject(representationRow.status),
				});
			}

			const declarationItems = buildDeclarationList(
				input.siren,
				mappedDeclarations,
				year,
				yearsWithPrefill,
				representationVisible,
			);

			return { company, declarations: declarationItems };
		}),

	updateHasCse: protectedProcedure
		.input(updateHasCseSchema)
		.mutation(async ({ ctx, input }) => {
			assertNotImpersonating(ctx.session);
			const company = await findUserCompany(ctx.db, ctx.session, input.siren);
			if (!isCseRequired(getObligationWorkforce(company.gipWorkforce))) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message:
						"Le champ CSE est réservé aux entreprises de 100 salariés et plus.",
				});
			}
			await ctx.db
				.update(companies)
				.set({ hasCse: input.hasCse })
				.where(eq(companies.siren, input.siren));

			// The engine reads a snapshot of the CSE requirement taken at
			// submission; realign it, otherwise a démarche parked on the CSE step
			// can never complete once the answer turns to "no CSE".
			await syncCseRequirement({
				db: ctx.db,
				siren: input.siren,
				year: getCurrentYear(),
				workforce: getObligationWorkforce(company.gipWorkforce),
				hasCse: input.hasCse,
				actorUserId: ctx.session.user.id,
			});
		}),
});
