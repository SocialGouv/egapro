import type { CampaignDeadlines } from "~/modules/domain";
import {
	EXPECTED_DECLARATION_TYPES,
	getDeclarationProcessStepDeadline,
	getDefaultCampaignDeadlines,
} from "~/modules/domain";

import type {
	DeclarationFsmStatus,
	DeclarationItem,
	DeclarationStatus,
	DeclarationType,
} from "./types";

type CompliancePath = "justify" | "corrective_action" | "joint_evaluation";

export type DbDeclaration = {
	type: DeclarationType;
	year: number;
	status: DeclarationStatus;
	fsmStatus: DeclarationFsmStatus | null;
	currentStep: number;
	updatedAt: Date | null;
	firstDeclarationPathChoice: CompliancePath | null;
	secondDeclarationPathChoice: CompliancePath | null;
	hasSubmittedSecondDeclaration: boolean;
	hasSubmittedJointEvaluation: boolean;
	hasSubmittedCseOpinion: boolean;
	cseRequired: boolean;
	hasJointEvaluationFile: boolean;
	hasPrefillData: boolean;
	deadline: Date | null;
	notSubject: boolean;
};

export function buildDeclarationList(
	siren: string,
	dbDeclarations: DbDeclaration[],
	currentYear: number,
	yearsWithPrefill: Set<number> = new Set(),
	representationVisible = true,
	// Only reached when the caller has nothing year-specific to hand in (e.g. a
	// unit test exercising the list shape, not the closure rule).
	currentYearDeadlines: CampaignDeadlines = getDefaultCampaignDeadlines(
		currentYear,
	),
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
				hasSubmittedJointEvaluation: existing.hasSubmittedJointEvaluation,
				hasSubmittedCseOpinion: existing.hasSubmittedCseOpinion,
				cseRequired: existing.cseRequired,
				hasJointEvaluationFile: existing.hasJointEvaluationFile,
				hasPrefillData: existing.hasPrefillData,
				deadline: existing.deadline,
				notSubject: existing.notSubject,
			});
		} else if (type !== "representation" || representationVisible) {
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
				hasSubmittedJointEvaluation: false,
				hasSubmittedCseOpinion: false,
				cseRequired: false,
				hasJointEvaluationFile: false,
				hasPrefillData:
					type === "remuneration" && yearsWithPrefill.has(currentYear),
				deadline:
					type === "remuneration"
						? getDeclarationProcessStepDeadline(null, currentYearDeadlines)
						: null,
				notSubject: false,
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
			hasSubmittedJointEvaluation: d.hasSubmittedJointEvaluation,
			hasSubmittedCseOpinion: d.hasSubmittedCseOpinion,
			cseRequired: d.cseRequired,
			hasJointEvaluationFile: d.hasJointEvaluationFile,
			hasPrefillData: d.hasPrefillData,
			deadline: d.deadline,
			notSubject: d.notSubject,
		});
	}

	return rows;
}
