import { and, eq } from "drizzle-orm";

import type { DB } from "~/server/db";
import { companies, declarations, users } from "~/server/db/schema";
import { mapCseOpinions } from "./mapIndicators";
import {
	fetchCseOpinionsByDeclaration,
	getDeclarationsWithIndicatorG,
	indicatorColumns,
} from "./queries";
import type { ExportRow } from "./types";

/**
 * Query all submitted declarations for a given year
 * and flatten them into ExportRow objects ready for XLSX generation.
 */
export async function buildExportRows(
	db: DB,
	year: number,
): Promise<ExportRow[]> {
	const rows = await db
		.select({
			siren: declarations.siren,
			year: declarations.year,
			status: declarations.status,
			compliancePath: declarations.compliancePath,
			totalWomen: declarations.totalWomen,
			totalMen: declarations.totalMen,
			remunerationScore: declarations.remunerationScore,
			variableRemunerationScore: declarations.variableRemunerationScore,
			quartileScore: declarations.quartileScore,
			categoryScore: declarations.categoryScore,
			secondDeclarationStatus: declarations.secondDeclarationStatus,
			secondDeclReferencePeriodStart:
				declarations.secondDeclReferencePeriodStart,
			secondDeclReferencePeriodEnd: declarations.secondDeclReferencePeriodEnd,
			createdAt: declarations.createdAt,
			updatedAt: declarations.updatedAt,
			declarationId: declarations.id,
			companyName: companies.name,
			workforce: companies.workforce,
			nafCode: companies.nafCode,
			address: companies.address,
			hasCse: companies.hasCse,
			declarantFirstName: users.firstName,
			declarantLastName: users.lastName,
			declarantEmail: users.email,
			declarantPhone: users.phone,
			...indicatorColumns,
		})
		.from(declarations)
		.innerJoin(companies, eq(declarations.siren, companies.siren))
		.innerJoin(users, eq(declarations.declarantId, users.id))
		.where(
			and(eq(declarations.status, "submitted"), eq(declarations.year, year)),
		);

	const declarationIds = rows.map((r) => r.declarationId);

	const [hasIndicatorG, cseMap] = await Promise.all([
		getDeclarationsWithIndicatorG(db, declarationIds),
		fetchCseOpinionsByDeclaration(declarationIds, db),
	]);

	return rows.map((row) => {
		return {
			siren: row.siren,
			companyName: row.companyName,
			workforce: row.workforce,
			nafCode: row.nafCode,
			address: row.address,
			hasCse: row.hasCse,
			year: row.year,
			status: row.status,
			declarationType: hasIndicatorG.has(row.declarationId)
				? ("7_indicateurs" as const)
				: ("6_indicateurs" as const),
			compliancePath: row.compliancePath,
			createdAt: row.createdAt?.toISOString() ?? null,
			updatedAt: row.updatedAt?.toISOString() ?? null,
			totalWomen: row.totalWomen,
			totalMen: row.totalMen,
			remunerationScore: row.remunerationScore,
			variableRemunerationScore: row.variableRemunerationScore,
			quartileScore: row.quartileScore,
			categoryScore: row.categoryScore,
			// Indicator A
			indAAnnualWomen: row.indicatorAAnnualWomen,
			indAAnnualMen: row.indicatorAAnnualMen,
			indAHourlyWomen: row.indicatorAHourlyWomen,
			indAHourlyMen: row.indicatorAHourlyMen,
			// Indicator B
			indBAnnualWomen: row.indicatorBAnnualWomen,
			indBAnnualMen: row.indicatorBAnnualMen,
			indBHourlyWomen: row.indicatorBHourlyWomen,
			indBHourlyMen: row.indicatorBHourlyMen,
			// Indicator C
			indCAnnualWomen: row.indicatorCAnnualWomen,
			indCAnnualMen: row.indicatorCAnnualMen,
			indCHourlyWomen: row.indicatorCHourlyWomen,
			indCHourlyMen: row.indicatorCHourlyMen,
			// Indicator D
			indDAnnualWomen: row.indicatorDAnnualWomen,
			indDAnnualMen: row.indicatorDAnnualMen,
			indDHourlyWomen: row.indicatorDHourlyWomen,
			indDHourlyMen: row.indicatorDHourlyMen,
			// Indicator E
			indEWomen: row.indicatorEWomen,
			indEMen: row.indicatorEMen,
			// Indicator F — annual
			indFAnnualQ1Threshold: row.indicatorFAnnualThreshold1,
			indFAnnualQ1Women: row.indicatorFAnnualWomen1,
			indFAnnualQ1Men: row.indicatorFAnnualMen1,
			indFAnnualQ2Threshold: row.indicatorFAnnualThreshold2,
			indFAnnualQ2Women: row.indicatorFAnnualWomen2,
			indFAnnualQ2Men: row.indicatorFAnnualMen2,
			indFAnnualQ3Threshold: row.indicatorFAnnualThreshold3,
			indFAnnualQ3Women: row.indicatorFAnnualWomen3,
			indFAnnualQ3Men: row.indicatorFAnnualMen3,
			indFAnnualQ4Threshold: row.indicatorFAnnualThreshold4,
			indFAnnualQ4Women: row.indicatorFAnnualWomen4,
			indFAnnualQ4Men: row.indicatorFAnnualMen4,
			// Indicator F — hourly
			indFHourlyQ1Threshold: row.indicatorFHourlyThreshold1,
			indFHourlyQ1Women: row.indicatorFHourlyWomen1,
			indFHourlyQ1Men: row.indicatorFHourlyMen1,
			indFHourlyQ2Threshold: row.indicatorFHourlyThreshold2,
			indFHourlyQ2Women: row.indicatorFHourlyWomen2,
			indFHourlyQ2Men: row.indicatorFHourlyMen2,
			indFHourlyQ3Threshold: row.indicatorFHourlyThreshold3,
			indFHourlyQ3Women: row.indicatorFHourlyWomen3,
			indFHourlyQ3Men: row.indicatorFHourlyMen3,
			indFHourlyQ4Threshold: row.indicatorFHourlyThreshold4,
			indFHourlyQ4Women: row.indicatorFHourlyWomen4,
			indFHourlyQ4Men: row.indicatorFHourlyMen4,
			secondDeclarationStatus: row.secondDeclarationStatus,
			secondDeclReferencePeriodStart: row.secondDeclReferencePeriodStart,
			secondDeclReferencePeriodEnd: row.secondDeclReferencePeriodEnd,
			declarantFirstName: row.declarantFirstName,
			declarantLastName: row.declarantLastName,
			declarantEmail: row.declarantEmail,
			declarantPhone: row.declarantPhone,
			...mapCseOpinions(cseMap.get(row.declarationId) ?? []),
		};
	});
}
