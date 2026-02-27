import type { DeclarationStatus } from "./types";

export function computeDeclarationStatus(
	declaration:
		| { status: string | null; currentStep: number | null }
		| undefined,
): DeclarationStatus {
	if (
		!declaration ||
		(declaration.status === "draft" && (declaration.currentStep ?? 0) === 0)
	) {
		return "to_complete";
	}
	if (declaration.status === "submitted") {
		return "done";
	}
	return "in_progress";
}
