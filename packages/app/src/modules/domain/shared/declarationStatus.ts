import type { DeclarationFsmStatus, DeclarationStatus } from "../types";

type CompliancePath = "justify" | "corrective_action" | "joint_evaluation";

export function isDeclarationSubmitted(
	status: DeclarationFsmStatus | null,
): boolean {
	return status !== null && status !== "draft";
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

export function isCancelled(declaration: {
	cancelledAt: Date | null;
}): boolean {
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
