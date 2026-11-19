import type {
	CampaignDeadlines,
	CompliancePathValue as CompliancePath,
	DeclarationFsmStatus,
	DeclarationStatus,
} from "../types";
import { isDeadlinePassed } from "./campaign";
import { getDeclarationProcessStepDeadline } from "./declarationProcessStep";
import type {
	LastTransmission,
	SubsequentSubmissions,
} from "./declarationTrajectory";

export function isDeclarationSubmitted(status: string | null): boolean {
	return status !== null && status !== "draft";
}

export function isDraft(status: string | null): boolean {
	return status === "draft";
}

export function isComplianceProcessCompleted(status: string | null): boolean {
	return status === "demarche_completed";
}

// `demarche_completed` alone does not close writing: a first declaration that no
// later submission supersedes stays writable.
export function isDeclarationWritingClosed(
	status: string | null,
	isFirstDeclarationSuperseded: boolean,
	lastTransmission?: LastTransmission | null,
): boolean {
	if (!isComplianceProcessCompleted(status) || !isFirstDeclarationSuperseded) {
		return false;
	}
	// With a CSE, the démarche closes on its opinion and every earlier deposit
	// stays locked. Without one, the last deposit remains writable until the
	// next campaign.
	return lastTransmission === undefined || lastTransmission === "cse_opinion";
}

export function getCurrentCompliancePath(declaration: {
	firstDeclarationPathChoice: CompliancePath | null;
	secondDeclarationPathChoice: CompliancePath | null;
}): CompliancePath | null {
	return (
		declaration.secondDeclarationPathChoice ??
		declaration.firstDeclarationPathChoice
	);
}

export function isInComplianceProcess(declaration: {
	status: DeclarationFsmStatus | null;
	firstDeclarationPathChoice: CompliancePath | null;
	secondDeclarationPathChoice: CompliancePath | null;
}): boolean {
	return (
		getCurrentCompliancePath(declaration) !== null ||
		declaration.status === "awaiting_compliance_path_choice" ||
		declaration.status === "awaiting_revision_choice"
	);
}

// Second declaration *started* (a step was reached or a path chosen). Distinct
// from `hasSubmittedSecondDeclaration`, which requires the submit event.
export function hasStartedSecondDeclaration(declaration: {
	secondDeclarationStep: number | null;
	secondDeclarationPathChoice: CompliancePath | null;
}): boolean {
	return (
		declaration.secondDeclarationStep !== null ||
		declaration.secondDeclarationPathChoice !== null
	);
}

const SECOND_DECLARATION_SAVED_STEP = 2;

export function hasSavedSecondDeclarationData(declaration: {
	secondDeclarationStep: number | null;
}): boolean {
	return (
		declaration.secondDeclarationStep !== null &&
		declaration.secondDeclarationStep >= SECOND_DECLARATION_SAVED_STEP
	);
}

export type SubmissionLockTarget =
	| "first_declaration"
	| "path_choice_round_1"
	| "path_choice_round_2";

// Events, not the FSM status: `demarche_completed` is also reachable straight from the first declaration.
export function isLockedBySubsequentSubmission(
	submissions: SubsequentSubmissions,
	target: SubmissionLockTarget,
): boolean {
	switch (target) {
		case "first_declaration":
			return (
				submissions.hasSubmittedSecondDeclaration ||
				submissions.hasSubmittedJointEvaluation ||
				submissions.hasSubmittedCseOpinion
			);
		case "path_choice_round_1":
			return (
				submissions.hasSubmittedCseOpinion ||
				submissions.hasSubmittedRound1JointEvaluation
			);
		case "path_choice_round_2":
			return (
				submissions.hasSubmittedCseOpinion ||
				submissions.hasSubmittedJointEvaluation
			);
	}
}

// Whether the compliance-path step (indicator G, ≥5% gap) should still be shown
// as part of the démarche. Company-characteristics alone (workforce, CSE,
// indicator G applicability) are not sufficient: the gap itself decides
// `phase2Required` in the rule engine, and that fact is not available on this
// page. Two direct transitions skip the compliance path entirely when it does
// not apply (`submit_to_cse_opinion_directly`, `submit_to_demarche_completed_directly`,
// both guarded by `not phase2Required`) and neither records a path choice — so
// a terminal state reached with no path choice at all proves the path never
// applied. `awaiting_compliance_path_choice` also has a null path choice, but
// that state means the path is still open, not skipped.
export function isCompliancePathStepApplicable(declaration: {
	status: DeclarationFsmStatus | null;
	firstDeclarationPathChoice: CompliancePath | null;
	secondDeclarationPathChoice: CompliancePath | null;
}): boolean {
	switch (declaration.status) {
		case null:
		case "draft":
		case "awaiting_compliance_path_choice":
		case "corrective_actions_chosen":
		case "joint_evaluation_chosen":
		case "awaiting_revision_choice":
		case "revised_joint_evaluation_chosen":
			return true;
		case "awaiting_cse_opinion":
		case "demarche_completed":
			return getCurrentCompliancePath(declaration) !== null;
	}
}

// The corrective-action second declaration may only be written while its funnel
// is actually open: right after the corrective-action path choice, or once the
// declaration has been re-opened for revision — or, for a démarche closed
// without a CSE, as long as it is the last transmission (epic #5128).
export function isSecondDeclarationWritable(
	status: DeclarationFsmStatus | null,
	lastTransmission?: LastTransmission | null,
): boolean {
	if (
		status === "corrective_actions_chosen" ||
		status === "awaiting_revision_choice"
	) {
		return true;
	}
	return (
		status === "demarche_completed" && lastTransmission === "second_declaration"
	);
}

// The joint-evaluation report may only be written while its funnel is actually
// open: right after the joint-evaluation path choice, or once the declaration
// has been re-opened for a revised joint evaluation. A démarche closed on that
// report keeps it writable until the next campaign — but only without a CSE,
// since with a CSE the démarche closes on the opinion (epic #5128).
export function isJointEvaluationWritable(
	status: DeclarationFsmStatus | null,
	lastTransmission?: LastTransmission | null,
): boolean {
	if (
		status === "joint_evaluation_chosen" ||
		status === "revised_joint_evaluation_chosen"
	) {
		return true;
	}
	return (
		status === "demarche_completed" && lastTransmission === "joint_evaluation"
	);
}

export function isCancelled<T extends { cancelledAt: Date | null }>(
	declaration: T,
): declaration is T & { cancelledAt: Date } {
	return declaration.cancelledAt !== null;
}

export function computeDeclarationStatus(
	declaration:
		| {
				status: string | null;
				currentStep: number | null;
				cancelledAt?: Date | null;
		  }
		| undefined,
): DeclarationStatus {
	if (
		!declaration ||
		(declaration.status === "draft" && (declaration.currentStep ?? 0) === 0)
	) {
		return "to_complete";
	}
	if (declaration.cancelledAt != null) {
		return "to_complete";
	}
	// Only the terminal FSM state means the démarche is fully done. Every other
	// non-draft state (awaiting_*_choice, *_chosen, awaiting_cse_opinion) is an
	// in-progress step the user still has to act on.
	if (declaration.status === "demarche_completed") {
		return "done";
	}
	return "in_progress";
}

// Second-pass projection composed on top of computeDeclarationStatus, rather than merged into
// it, so that function's exhaustive FSM signature stays untouched. `year < currentYear` alone is
// unsafe early in the following year: the prior campaign's deadlines (e.g. decl2CseOpinionDeadline,
// March 1st N+1) can still be open, so closing also requires that row's own-year step deadline to have passed.
export function applyDeclarationClosure(params: {
	status: DeclarationStatus;
	fsmStatus: DeclarationFsmStatus | null;
	year: number;
	currentYear: number;
	deadlines: CampaignDeadlines;
	now?: Date;
}): DeclarationStatus {
	const { status, fsmStatus, year, currentYear, deadlines, now } = params;
	if (year >= currentYear || status === "done") {
		return status;
	}
	const stepDeadline = getDeclarationProcessStepDeadline(fsmStatus, deadlines);
	if (stepDeadline === null || !isDeadlinePassed(stepDeadline, now)) {
		return status;
	}
	if (status === "in_progress") {
		return "closed_incomplete";
	}
	if (status === "to_complete") {
		return "closed_not_done";
	}
	return status;
}

export type CompliancePathReadOnlyReason =
	| "demarche_completed"
	| "cse_opinion_submitted"
	| "second_declaration_submitted"
	| "joint_evaluation_submitted";

export function getCompliancePathReadOnlyReason(params: {
	status: DeclarationFsmStatus;
	pathChoice: CompliancePath | null;
	hasSubmittedSecondDeclaration: boolean;
	hasSubmittedCseOpinion: boolean;
	hasSubmittedJointEvaluation: boolean;
	lastTransmission?: LastTransmission | null;
}): CompliancePathReadOnlyReason | null {
	const {
		status,
		pathChoice,
		hasSubmittedSecondDeclaration,
		hasSubmittedCseOpinion,
		hasSubmittedJointEvaluation,
		lastTransmission,
	} = params;

	// A terminal path choice ("justify" without a CSE) stays writable until the
	// next campaign as long as nothing superseded it (epic #5128).
	const keepsTerminalPathChoiceWritable =
		lastTransmission === "path_choice_round_1" ||
		lastTransmission === "path_choice_round_2";

	if (
		isComplianceProcessCompleted(status) &&
		!keepsTerminalPathChoiceWritable
	) {
		return "demarche_completed";
	}
	if (pathChoice === "justify" && hasSubmittedCseOpinion)
		return "cse_opinion_submitted";
	if (pathChoice === "corrective_action" && hasSubmittedSecondDeclaration)
		return "second_declaration_submitted";
	if (pathChoice === "joint_evaluation" && hasSubmittedJointEvaluation)
		return "joint_evaluation_submitted";
	return null;
}
