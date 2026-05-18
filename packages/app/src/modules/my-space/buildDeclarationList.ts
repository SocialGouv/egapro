import { EXPECTED_DECLARATION_TYPES } from "~/modules/domain";

import type {
	DeclarationFsmStatus,
	DeclarationItem,
	DeclarationStatus,
	DeclarationType,
} from "./types";

type CompliancePath = "justify" | "corrective_action" | "joint_evaluation";

type DbDeclaration = {
	type: DeclarationType;
	year: number;
	status: DeclarationStatus;
	fsmStatus: DeclarationFsmStatus | null;
	currentStep: number;
	updatedAt: Date | null;
	firstDeclarationPathChoice: CompliancePath | null;
	secondDeclarationPathChoice: CompliancePath | null;
	hasSubmittedSecondDeclaration: boolean;
	hasSubmittedCseOpinion: boolean;
	cseRequired: boolean;
	hasJointEvaluationFile: boolean;
	hasPrefillData: boolean;
};

export function buildDeclarationList(
	siren: string,
	dbDeclarations: DbDeclaration[],
	currentYear: number,
	yearsWithPrefill: Set<number> = new Set(),
): DeclarationItem[] {
	const rows: DeclarationItem[] = [];

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
				fsmStatus: existing.fsmStatus,
				currentStep: existing.currentStep,
				updatedAt: existing.updatedAt,
				firstDeclarationPathChoice: existing.firstDeclarationPathChoice,
				secondDeclarationPathChoice: existing.secondDeclarationPathChoice,
				hasSubmittedSecondDeclaration: existing.hasSubmittedSecondDeclaration,
				hasSubmittedCseOpinion: existing.hasSubmittedCseOpinion,
				cseRequired: existing.cseRequired,
				hasJointEvaluationFile: existing.hasJointEvaluationFile,
				hasPrefillData: existing.hasPrefillData,
			});
		} else {
			rows.push({
				type,
				siren,
				year: currentYear,
				status: "to_complete",
				fsmStatus: null,
				currentStep: 0,
				updatedAt: null,
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				hasSubmittedSecondDeclaration: false,
				hasSubmittedCseOpinion: false,
				cseRequired: false,
				hasJointEvaluationFile: false,
				hasPrefillData:
					type === "remuneration" && yearsWithPrefill.has(currentYear),
			});
		}
	}

	const previousYears = dbDeclarations
		.filter((d) => d.year < currentYear)
		.sort((a, b) => b.year - a.year);

	for (const d of previousYears) {
		rows.push({
			type: d.type,
			siren,
			year: d.year,
			status: d.status,
			fsmStatus: d.fsmStatus,
			currentStep: d.currentStep,
			updatedAt: d.updatedAt,
			firstDeclarationPathChoice: d.firstDeclarationPathChoice,
			secondDeclarationPathChoice: d.secondDeclarationPathChoice,
			hasSubmittedSecondDeclaration: d.hasSubmittedSecondDeclaration,
			hasSubmittedCseOpinion: d.hasSubmittedCseOpinion,
			cseRequired: d.cseRequired,
			hasJointEvaluationFile: d.hasJointEvaluationFile,
			hasPrefillData: d.hasPrefillData,
		});
	}

	return rows;
}
