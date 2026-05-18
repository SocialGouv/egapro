import type { CompliancePathValue } from "../steps/compliancePath/constants";

const COMPLIANCE_CONFIRMATION_PATH =
	"/declaration-remuneration/parcours-conformite/confirmation";
const COMPLIANCE_PATH = "/declaration-remuneration/parcours-conformite";
const JOINT_EVALUATION_PATH = `${COMPLIANCE_PATH}/evaluation-conjointe`;
const RECAPITULATIF_PATH = "/declaration-remuneration/recapitulatif";

/**
 * Returns the destination URL after completing a compliance path step,
 * based on whether the company has a CSE (works council).
 *
 * - Has CSE → redirect to CSE opinion page
 * - No CSE or unknown → redirect to the compliance confirmation page
 */
export function getPostComplianceDestination(hasCse: boolean | null): string {
	return hasCse === true ? "/avis-cse" : COMPLIANCE_CONFIRMATION_PATH;
}

type CseOpinionPreviousContext = {
	firstDeclarationPathChoice: CompliancePathValue | null;
	hasSubmittedSecondDeclaration: boolean;
};

/**
 * Mirrors the forward-navigation rules that lead the user to /avis-cse, so
 * the "Précédent" button on step 1 returns to the page they came from:
 *
 * - Second declaration already submitted → its recap
 * - First-decl path = joint_evaluation → the joint evaluation form
 * - First-decl path = justify → the compliance path choice page
 * - No path chosen (no gap, or arriving from /mon-espace) → first-decl recap
 */
export function getCseOpinionPreviousHref({
	firstDeclarationPathChoice,
	hasSubmittedSecondDeclaration,
}: CseOpinionPreviousContext): string {
	if (hasSubmittedSecondDeclaration) {
		return `${RECAPITULATIF_PATH}?type=correction`;
	}
	if (firstDeclarationPathChoice === "joint_evaluation") {
		return JOINT_EVALUATION_PATH;
	}
	if (firstDeclarationPathChoice === "justify") {
		return COMPLIANCE_PATH;
	}
	return RECAPITULATIF_PATH;
}
