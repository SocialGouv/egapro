import type { CompliancePathValue } from "../steps/compliancePath/constants";

const COMPLIANCE_CONFIRMATION_PATH =
	"/declaration-remuneration/parcours-conformite/confirmation";
const COMPLIANCE_PATH = "/declaration-remuneration/parcours-conformite";
const JOINT_EVALUATION_PATH = `${COMPLIANCE_PATH}/evaluation-conjointe`;
const FIRST_DECLARATION_RECAP_PATH = "/declaration-remuneration/etape/6";
const SECOND_DECLARATION_RECAP_PATH = `${COMPLIANCE_PATH}/etape/3`;
const CSE_OPINION_PATH = "/avis-cse";
const CORRECTIVE_ACTIONS_FIRST_STEP_PATH = `${COMPLIANCE_PATH}/etape/1`;

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
	secondDeclarationPathChoice: CompliancePathValue | null;
	hasSubmittedSecondDeclaration: boolean;
};

/**
 * Mirrors the rule-engine transitions that lead the user to /avis-cse
 * (state `awaiting_cse_opinion` in `server/rules/v2027.1.json`) and
 * returns the URL of the page they came from:
 *
 * Round 2 (corrective second declaration submitted):
 * - revised justify chosen → compliance path choice page
 * - revised joint evaluation submitted → joint evaluation form
 * - resolved (no more gap) → second-declaration recap step
 *
 * Round 1 (initial submission):
 * - joint evaluation submitted → joint evaluation form
 * - justify chosen → compliance path choice page
 * - direct submit (no gap, has CSE) → first-declaration recap step
 */
/**
 * Returns the URL of the page that represents the user's current stage in
 * the FSM (`server/rules/v2027.1.json`). Used by recap-step "Suivant"
 * buttons to send the user **directly** to where they should be, instead
 * of routing through /parcours-conformite which would re-render the
 * compliance path choice page when the user has already moved past it.
 *
 * The status here is the projected `declarations.status` from the
 * event-sourced history (FSM final state).
 */
export function getCurrentStageHref(
	status: string | null,
	hasCse: boolean | null,
): string {
	switch (status) {
		case "awaiting_compliance_path_choice":
		case "awaiting_revision_choice":
			return COMPLIANCE_PATH;
		case "corrective_actions_chosen":
			return CORRECTIVE_ACTIONS_FIRST_STEP_PATH;
		case "joint_evaluation_chosen":
		case "revised_joint_evaluation_chosen":
			return JOINT_EVALUATION_PATH;
		case "awaiting_cse_opinion":
			return CSE_OPINION_PATH;
		case "demarche_completed":
			return hasCse === true ? CSE_OPINION_PATH : COMPLIANCE_CONFIRMATION_PATH;
		default:
			return COMPLIANCE_PATH;
	}
}

export function getCseOpinionPreviousHref({
	firstDeclarationPathChoice,
	secondDeclarationPathChoice,
	hasSubmittedSecondDeclaration,
}: CseOpinionPreviousContext): string {
	if (hasSubmittedSecondDeclaration) {
		if (secondDeclarationPathChoice === "joint_evaluation") {
			return JOINT_EVALUATION_PATH;
		}
		if (secondDeclarationPathChoice === "justify") {
			return COMPLIANCE_PATH;
		}
		return SECOND_DECLARATION_RECAP_PATH;
	}
	if (firstDeclarationPathChoice === "joint_evaluation") {
		return JOINT_EVALUATION_PATH;
	}
	if (firstDeclarationPathChoice === "justify") {
		return COMPLIANCE_PATH;
	}
	return FIRST_DECLARATION_RECAP_PATH;
}
