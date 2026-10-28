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
} from "~/modules/routes";

const SECOND_DECLARATION_RECAP = complianceStepHref(3);
const CORRECTIVE_ACTIONS_FIRST_STEP = complianceStepHref(1);

/**
 * The single table: in state X, the user belongs on screen Y. No `default:`, so
 * a new `DECLARATION_FSM_STATUSES` entry fails `tsc` instead of falling back.
 *
 * `terminalHref` is a parameter because `demarche_completed` is terminal but not
 * inert — a CSE opinion stays re-submittable — and each surface answers that
 * differently. `null` never reaches here for the same reason: it means "no
 * démarche", not a state, and each caller reads it its own way.
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

export function getDemarcheResumeHref(
	status: DeclarationFsmStatus,
	terminalHref: AppHref,
	secondDeclarationSaved: boolean,
): AppHref {
	if (status === "corrective_actions_chosen" && secondDeclarationSaved) {
		return SECOND_DECLARATION_RECAP;
	}
	return getDemarcheStageHref(status, terminalHref);
}

// Takes the decision, not its inputs: on `hasCse` alone this sent a company
// under 100 salariés into /avis-cse, whose layout bounced it straight back here.
export function getPostComplianceDestination(
	cseOpinionRequired: boolean,
): AppHref {
	return cseOpinionRequired ? CSE_OPINION : COMPLIANCE_CONFIRMATION;
}

/**
 * The funnel's reading of the table: the recap "Suivant" lands the user directly
 * on their stage, instead of routing through /parcours-conformite, which would
 * re-render the path choice for someone who has already moved past it.
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
