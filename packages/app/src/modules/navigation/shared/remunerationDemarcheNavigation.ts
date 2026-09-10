import type {
	CompliancePathValue,
	DeclarationFsmStatus,
} from "~/modules/domain";
import type { AppHref } from "~/modules/routes";
import {
	COMPLIANCE_CONFIRMATION,
	COMPLIANCE_JOINT_EVALUATION,
	COMPLIANCE_PATH,
	CSE_OPINION,
	complianceStepHref,
	DECLARATION_REMUNERATION,
	LAST_REMUNERATION_STEP,
	remunerationStepHref,
} from "~/modules/routes";

const FIRST_DECLARATION_RECAP = remunerationStepHref(LAST_REMUNERATION_STEP);
const SECOND_DECLARATION_RECAP = complianceStepHref(3);
const CORRECTIVE_ACTIONS_FIRST_STEP = complianceStepHref(1);

/**
 * The single table: in state X, the user belongs on screen Y.
 *
 * Total over the 8 engine states and written as a `switch` with no `default:`,
 * so adding a state to `DECLARATION_FSM_STATUSES` fails `tsc` here rather than
 * silently routing to a fallback.
 *
 * Two things it deliberately does not decide, because they are surface policy
 * and not engine state — each caller passes its own answer:
 *
 * - `null` (no FSM status yet) is not an engine state, it is "no démarche". It
 *   never reaches this function: the recap mirror reads it as "start the path
 *   choice", Mon espace as "enter the tunnel", and both are right for their own
 *   surface.
 * - `demarche_completed` is terminal but not inert — a CSE opinion stays
 *   re-submittable (up to 4). `terminalHref` is where that surface considers a
 *   completed démarche should lead.
 */
export function getDemarcheStageHref(
	status: DeclarationFsmStatus,
	terminalHref: AppHref,
): AppHref {
	switch (status) {
		case "draft":
			return DECLARATION_REMUNERATION;
		case "awaiting_compliance_path_choice":
		case "awaiting_revision_choice":
			return COMPLIANCE_PATH;
		case "corrective_actions_chosen":
			return CORRECTIVE_ACTIONS_FIRST_STEP;
		case "joint_evaluation_chosen":
		case "revised_joint_evaluation_chosen":
			return COMPLIANCE_JOINT_EVALUATION;
		case "awaiting_cse_opinion":
			return CSE_OPINION;
		case "demarche_completed":
			return terminalHref;
	}
}

// Takes the decision, not its inputs: on `hasCse` alone this sent a company
// under 100 salariés into /avis-cse, whose layout bounced it straight back here.
export function getPostComplianceDestination(
	cseOpinionRequired: boolean,
): AppHref {
	return cseOpinionRequired ? CSE_OPINION : COMPLIANCE_CONFIRMATION;
}

/**
 * The declaration funnel's reading of the table: where the recap "Suivant"
 * buttons send a user, so they land **directly** on their current stage instead
 * of routing through /parcours-conformite, which would re-render the path choice
 * page for a user who has already moved past it.
 *
 * `status` is the projected `declarations.status` (FSM final state); `null`
 * means the démarche has not started, and this surface opens on the path choice.
 */
export function getCurrentStageHref(
	status: DeclarationFsmStatus | null,
	cseOpinionRequired: boolean,
): AppHref {
	if (status === null) {
		return COMPLIANCE_PATH;
	}
	return getDemarcheStageHref(
		status,
		getPostComplianceDestination(cseOpinionRequired),
	);
}

/** Path choice → destination. Same shape as the state table, same `default:` ban. */
export function getCompliancePathHref(
	path: CompliancePathValue,
	cseOpinionRequired: boolean,
): AppHref {
	switch (path) {
		case "corrective_action":
			return CORRECTIVE_ACTIONS_FIRST_STEP;
		case "joint_evaluation":
			return COMPLIANCE_JOINT_EVALUATION;
		// "justify" has no dedicated page: when an opinion is due it remains to be
		// deposited on /avis-cse; otherwise the FSM already completed the démarche
		// (choose_path_*_justify_without_cse) → confirmation page.
		case "justify":
			return getPostComplianceDestination(cseOpinionRequired);
	}
}

/**
 * Provenance: the engine transitions that land on `awaiting_cse_opinion`, keyed
 * by their id in `server/rules/v2027.1.json`. Keeping the engine's own ids as
 * keys is what lets `fsmMirrors.conformance.test.ts` derive the expected set
 * from `rules.transitions` — adding an incoming transition without branching
 * here breaks that test instead of silently sending "Précédent" to the wrong page.
 */
export type CseOpinionOrigin =
	| "choose_path_initial_justify_with_cse"
	| "choose_path_revised_justify_with_cse"
	| "submit_joint_evaluation_initial_with_cse"
	| "submit_joint_evaluation_revised_with_cse"
	| "submit_second_declaration_resolved_with_cse"
	| "submit_to_cse_opinion_directly";

export const CSE_OPINION_PREVIOUS_HREF: Record<CseOpinionOrigin, AppHref> = {
	choose_path_initial_justify_with_cse: COMPLIANCE_PATH,
	choose_path_revised_justify_with_cse: COMPLIANCE_PATH,
	submit_joint_evaluation_initial_with_cse: COMPLIANCE_JOINT_EVALUATION,
	submit_joint_evaluation_revised_with_cse: COMPLIANCE_JOINT_EVALUATION,
	submit_second_declaration_resolved_with_cse: SECOND_DECLARATION_RECAP,
	submit_to_cse_opinion_directly: FIRST_DECLARATION_RECAP,
};

export type CseOpinionOriginContext = {
	firstDeclarationPathChoice: CompliancePathValue | null;
	secondDeclarationPathChoice: CompliancePathValue | null;
	hasSubmittedSecondDeclaration: boolean;
};

/** Which of the six incoming transitions the stored démarche corresponds to. */
export function resolveCseOpinionOrigin({
	firstDeclarationPathChoice,
	secondDeclarationPathChoice,
	hasSubmittedSecondDeclaration,
}: CseOpinionOriginContext): CseOpinionOrigin {
	if (hasSubmittedSecondDeclaration) {
		if (secondDeclarationPathChoice === "joint_evaluation") {
			return "submit_joint_evaluation_revised_with_cse";
		}
		if (secondDeclarationPathChoice === "justify") {
			return "choose_path_revised_justify_with_cse";
		}
		return "submit_second_declaration_resolved_with_cse";
	}
	if (firstDeclarationPathChoice === "joint_evaluation") {
		return "submit_joint_evaluation_initial_with_cse";
	}
	if (firstDeclarationPathChoice === "justify") {
		return "choose_path_initial_justify_with_cse";
	}
	return "submit_to_cse_opinion_directly";
}

export function getCseOpinionPreviousHref(
	context: CseOpinionOriginContext,
): AppHref {
	return CSE_OPINION_PREVIOUS_HREF[resolveCseOpinionOrigin(context)];
}

export function getCompliancePathPreviousHref(isSecondRound: boolean): AppHref {
	return isSecondRound ? SECOND_DECLARATION_RECAP : FIRST_DECLARATION_RECAP;
}
