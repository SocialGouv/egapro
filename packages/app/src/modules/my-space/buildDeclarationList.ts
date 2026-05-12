import { EXPECTED_DECLARATION_TYPES } from "~/modules/domain";

import type {
	DeclarationItem,
	DeclarationStatus,
	DeclarationType,
} from "./types";

type CompliancePath = "justify" | "corrective_action" | "joint_evaluation";

type DbDeclaration = {
	type: DeclarationType;
	year: number;
	status: DeclarationStatus;
	currentStep: number;
	updatedAt: Date | null;
	firstDeclarationPathChoice: CompliancePath | null;
	secondDeclarationPathChoice: CompliancePath | null;
	secondDeclarationSubmittedAt: Date | null;
	demarcheCompletedAt: Date | null;
	cseOpinionCompletedAt: Date | null;
	hasJointEvaluationFile: boolean;
	hasPrefillData: boolean;
};

/**
 * Builds the full list of declaration rows by merging expected rows
 * (one per type for the current year) with actual DB records.
 *
 * - Current year: one row per expected type, using DB data when available
 *   or a "to_complete" placeholder otherwise.
 * - Previous years: only rows that exist in DB.
 * - Sorted: current year first, then previous years descending.
 */
export function buildDeclarationList(
	siren: string,
	dbDeclarations: DbDeclaration[],
	currentYear: number,
	yearsWithPrefill: Set<number> = new Set(),
): DeclarationItem[] {
	const rows: DeclarationItem[] = [];

	// Current year: ensure one row per expected type
	for (const type of EXPECTED_DECLARATION_TYPES) {
		const existing = dbDeclarations.find(
			(d) => d.year === currentYear && d.type === type,
		);
		if (existing) {
			rows.push({
				type,
				siren,
				year: currentYear,
				status: existing.status,
				currentStep: existing.currentStep,
				updatedAt: existing.updatedAt,
				firstDeclarationPathChoice: existing.firstDeclarationPathChoice,
				secondDeclarationPathChoice: existing.secondDeclarationPathChoice,
				secondDeclarationSubmittedAt: existing.secondDeclarationSubmittedAt,
				demarcheCompletedAt: existing.demarcheCompletedAt,
				cseOpinionCompletedAt: existing.cseOpinionCompletedAt,
				hasJointEvaluationFile: existing.hasJointEvaluationFile,
				hasPrefillData: existing.hasPrefillData,
			});
		} else {
			rows.push({
				type,
				siren,
				year: currentYear,
				status: "to_complete",
				currentStep: 0,
				updatedAt: null,
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				secondDeclarationSubmittedAt: null,
				demarcheCompletedAt: null,
				cseOpinionCompletedAt: null,
				hasJointEvaluationFile: false,
				hasPrefillData:
					type === "remuneration" && yearsWithPrefill.has(currentYear),
			});
		}
	}

	// Previous years: only show DB records, sorted by year desc
	const previousYears = dbDeclarations
		.filter((d) => d.year < currentYear)
		.sort((a, b) => b.year - a.year);

	for (const d of previousYears) {
		rows.push({
			type: d.type,
			siren,
			year: d.year,
			status: d.status,
			currentStep: d.currentStep,
			updatedAt: d.updatedAt,
			firstDeclarationPathChoice: d.firstDeclarationPathChoice,
			secondDeclarationPathChoice: d.secondDeclarationPathChoice,
			secondDeclarationSubmittedAt: d.secondDeclarationSubmittedAt,
			demarcheCompletedAt: d.demarcheCompletedAt,
			cseOpinionCompletedAt: d.cseOpinionCompletedAt,
			hasJointEvaluationFile: d.hasJointEvaluationFile,
			hasPrefillData: d.hasPrefillData,
		});
	}

	return rows;
}
