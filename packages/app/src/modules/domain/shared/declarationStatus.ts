import type {
	CampaignDeadlines,
	DeclarationFsmStatus,
	DeclarationStatus,
} from "../types";
import { isDeadlinePassed } from "./campaign";
import { getDeclarationProcessStepDeadline } from "./declarationProcessStep";

type CompliancePath = "justify" | "corrective_action" | "joint_evaluation";

export function isDeclarationSubmitted(status: string | null): boolean {
	return status !== null && status !== "draft";
}

export function isDraft(status: string | null): boolean {
	return status === "draft";
}

export function isComplianceProcessCompleted(status: string | null): boolean {
	return status === "demarche_completed";
}

// Neither condition alone closes writing: `demarche_completed` is reached as
// early as March for a no-gap declaration, and `decl1ModificationDeadline`
// routinely elapses months before the compliance-path pages stop needing to
// write. Distinct from the step-level cutoff, which uses `isDeclarationSubmitted`.
export function isDeclarationWritingClosed(
	status: string | null,
	decl1ModificationDeadline: Date,
): boolean {
	return (
		isComplianceProcessCompleted(status) &&
		isDeadlinePassed(decl1ModificationDeadline)
	);
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

export function isSecondDeclarationDeadlineApplicable(declaration: {
	status: DeclarationFsmStatus | null;
	secondDeclarationStep: number | null;
	secondDeclarationPathChoice: CompliancePath | null;
}): boolean {
	switch (declaration.status) {
		case null:
		case "draft":
		case "awaiting_compliance_path_choice":
		case "joint_evaluation_chosen":
			return false;
		case "corrective_actions_chosen":
		case "awaiting_revision_choice":
		case "revised_joint_evaluation_chosen":
			return true;
		// Terminal states are reachable from round 1 too, so the second-declaration
		// deadline only governs them once a correction round has actually started.
		case "awaiting_cse_opinion":
		case "demarche_completed":
			return hasStartedSecondDeclaration(declaration);
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
// declaration has been re-opened for revision. Any other status means round 2
// never started (or is already resolved), so the write is rejected.
export function isSecondDeclarationWritable(
	status: DeclarationFsmStatus | null,
): boolean {
	return (
		status === "corrective_actions_chosen" ||
		status === "awaiting_revision_choice"
	);
}

// The joint-evaluation report may only be written while its funnel is actually
// open: right after the joint-evaluation path choice, or once the declaration
// has been re-opened for a revised joint evaluation. Any other status — closed
// démarche included — has no matching transition, so the write is rejected.
export function isJointEvaluationWritable(
	status: DeclarationFsmStatus | null,
): boolean {
	return (
		status === "joint_evaluation_chosen" ||
		status === "revised_joint_evaluation_chosen"
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
// unsafe in Jan/Feb: the prior campaign's deadlines (e.g. decl2CseOpinionDeadline, Feb 1st) can
// still be open, so closing also requires that row's own-year step deadline to have passed.
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
