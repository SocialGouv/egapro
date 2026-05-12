import type { DeclarationStatus } from "../types";

type CompliancePath = "justify" | "corrective_action" | "joint_evaluation";

export function getCurrentCompliancePath(declaration: {
	firstDeclarationPathChoice: CompliancePath | null;
	secondDeclarationPathChoice: CompliancePath | null;
}): CompliancePath | null {
	return (
		declaration.secondDeclarationPathChoice ??
		declaration.firstDeclarationPathChoice
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
	if (declaration.status !== null && declaration.status !== "draft") {
		return "done";
	}
	return "in_progress";
}
