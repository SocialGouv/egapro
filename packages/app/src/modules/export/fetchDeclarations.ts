// Types and pure functions for building the declaration JSON response.
// DB queries are in queries.ts (server-only, not unit-testable).

export type { DeclarationRow } from "./queries";
// Re-export queries for route handler convenience
export {
	fetchCategoriesByDeclaration,
	fetchCseOpinionsByDeclaration,
	fetchIndicatorGByDeclaration,
	fetchSubmittedDeclarations,
} from "./queries";

import type { DeclarationRow } from "./queries";

// ── Types ────────────────────────────────────────────────────────────

export type CategoryRow = {
	step: number;
	categoryName: string;
	womenCount: number | null;
	menCount: number | null;
	womenValue: string | null;
	menValue: string | null;
	womenMedianValue: string | null;
	menMedianValue: string | null;
};

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

// ── Build indicators from raw rows ───────────────────────────────────

const MEAN_CATEGORIES = ["Annuelle brute moyenne", "Horaire brute moyenne"];
const MEDIAN_CATEGORIES = ["Annuelle brute médiane", "Horaire brute médiane"];
const BENEFICIARY_CATEGORY = "Bénéficiaires";

export function buildIndicators(categories: CategoryRow[]) {
	const step2 = categories.filter((c) => c.step === 2);
	const step3 = categories.filter((c) => c.step === 3);
	const step4 = categories.filter((c) => c.step === 4);

	const payValue = (c: CategoryRow) => ({
		category: c.categoryName,
		womenValue: c.womenValue,
		menValue: c.menValue,
	});

	return {
		A: step2
			.filter((c) => MEAN_CATEGORIES.includes(c.categoryName))
			.map(payValue),
		B: step3
			.filter(
				(c) =>
					MEAN_CATEGORIES.includes(c.categoryName) &&
					c.categoryName !== BENEFICIARY_CATEGORY,
			)
			.map(payValue),
		C: step2
			.filter((c) => MEDIAN_CATEGORIES.includes(c.categoryName))
			.map(payValue),
		D: step3
			.filter((c) => MEDIAN_CATEGORIES.includes(c.categoryName))
			.map(payValue),
		E: step3
			.filter((c) => c.categoryName === BENEFICIARY_CATEGORY)
			.map(payValue),
		F: step4.map((c) => ({
			category: c.categoryName,
			womenCount: c.womenCount,
			menCount: c.menCount,
			womenValue: c.womenValue,
		})),
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
	categories: CategoryRow[],
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
			...buildIndicators(categories),
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
