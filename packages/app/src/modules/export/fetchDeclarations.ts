// Types and pure functions for building the declaration JSON response.
// DB queries are in queries.ts (server-only, not unit-testable).

export type { DeclarationRow } from "./queries";
// Re-export queries for route handler convenience
export {
	fetchCseFilesByDeclaration,
	fetchCseOpinionsByDeclaration,
	fetchFileById,
	fetchIndicatorGByDeclaration,
	fetchJointEvaluationFilesByDeclaration,
	fetchSubmittedDeclarations,
} from "./queries";

import type { DeclarationRow } from "./queries";

// ── Types ────────────────────────────────────────────────────────────

export type IndicatorGEntry = {
	categoryName: string;
	detail: string | null;
	declarationType: string;
	womenCount: number | null;
	menCount: number | null;
	annualBaseWomen: string | null;
	annualBaseMen: string | null;
	annualVariableWomen: string | null;
	annualVariableMen: string | null;
	hourlyBaseWomen: string | null;
	hourlyBaseMen: string | null;
	hourlyVariableWomen: string | null;
	hourlyVariableMen: string | null;
};

export type CseRow = {
	type: string;
	opinion: string | null;
	opinionDate: string | null;
};

export type FileRow = {
	id: string;
	siren: string;
	year: number;
	fileName: string;
	filePath: string;
	uploadedAt: Date;
};

// ── Build indicators from declaration columns ─────────────────────────

export function buildIndicators(row: DeclarationRow) {
	return {
		A: {
			annualWomen: row.indicatorAAnnualWomen,
			annualMen: row.indicatorAAnnualMen,
			hourlyWomen: row.indicatorAHourlyWomen,
			hourlyMen: row.indicatorAHourlyMen,
		},
		B: {
			annualWomen: row.indicatorBAnnualWomen,
			annualMen: row.indicatorBAnnualMen,
			hourlyWomen: row.indicatorBHourlyWomen,
			hourlyMen: row.indicatorBHourlyMen,
		},
		C: {
			annualWomen: row.indicatorCAnnualWomen,
			annualMen: row.indicatorCAnnualMen,
			hourlyWomen: row.indicatorCHourlyWomen,
			hourlyMen: row.indicatorCHourlyMen,
		},
		D: {
			annualWomen: row.indicatorDAnnualWomen,
			annualMen: row.indicatorDAnnualMen,
			hourlyWomen: row.indicatorDHourlyWomen,
			hourlyMen: row.indicatorDHourlyMen,
		},
		E: {
			women: row.indicatorEWomen,
			men: row.indicatorEMen,
		},
		F: {
			annual: [
				{
					threshold: row.indicatorFAnnualThreshold1,
					women: row.indicatorFAnnualWomen1,
					men: row.indicatorFAnnualMen1,
				},
				{
					threshold: row.indicatorFAnnualThreshold2,
					women: row.indicatorFAnnualWomen2,
					men: row.indicatorFAnnualMen2,
				},
				{
					threshold: row.indicatorFAnnualThreshold3,
					women: row.indicatorFAnnualWomen3,
					men: row.indicatorFAnnualMen3,
				},
				{
					threshold: row.indicatorFAnnualThreshold4,
					women: row.indicatorFAnnualWomen4,
					men: row.indicatorFAnnualMen4,
				},
			],
			hourly: [
				{
					threshold: row.indicatorFHourlyThreshold1,
					women: row.indicatorFHourlyWomen1,
					men: row.indicatorFHourlyMen1,
				},
				{
					threshold: row.indicatorFHourlyThreshold2,
					women: row.indicatorFHourlyWomen2,
					men: row.indicatorFHourlyMen2,
				},
				{
					threshold: row.indicatorFHourlyThreshold3,
					women: row.indicatorFHourlyWomen3,
					men: row.indicatorFHourlyMen3,
				},
				{
					threshold: row.indicatorFHourlyThreshold4,
					women: row.indicatorFHourlyWomen4,
					men: row.indicatorFHourlyMen4,
				},
			],
		},
	};
}

type IndicatorGCategory = Omit<IndicatorGEntry, "declarationType">;

export function buildIndicatorG(entries: IndicatorGEntry[]): {
	initial: IndicatorGCategory[];
	correction: IndicatorGCategory[];
} {
	const toCategory = ({ declarationType: _, ...rest }: IndicatorGEntry) => rest;

	return {
		initial: entries
			.filter((e) => e.declarationType === "initial")
			.map(toCategory),
		correction: entries
			.filter((e) => e.declarationType === "correction")
			.map(toCategory),
	};
}

// ── Assemble declaration response ────────────────────────────────────

export function assembleDeclaration(
	row: DeclarationRow,
	indicatorGEntries: IndicatorGEntry[],
	opinions: CseRow[],
) {
	const { initial, correction } = buildIndicatorG(indicatorGEntries);

	return {
		siren: row.siren,
		companyName: row.companyName,
		workforce: row.workforce,
		nafCode: row.nafCode,
		address: row.address,
		hasCse: row.hasCse,
		year: row.year,
		status: row.status,
		compliancePath: row.compliancePath,
		createdAt: row.createdAt?.toISOString() ?? null,
		updatedAt: row.updatedAt?.toISOString() ?? null,
		totalWomen: row.totalWomen,
		totalMen: row.totalMen,
		indicators: {
			...buildIndicators(row),
			G: initial.length > 0 ? initial : null,
		},
		secondDeclaration: {
			status: row.secondDeclarationStatus,
			referencePeriodStart: row.secondDeclReferencePeriodStart,
			referencePeriodEnd: row.secondDeclReferencePeriodEnd,
			correction: correction.length > 0 ? correction : null,
		},
		declarant: {
			firstName: row.declarantFirstName,
			lastName: row.declarantLastName,
			email: row.declarantEmail,
			phone: row.declarantPhone,
		},
		cseOpinions: opinions.map((o) => ({
			type: o.type,
			opinion: o.opinion,
			date: o.opinionDate,
		})),
	};
}
