import type {
	CseOpinionReceiptVariant,
	DeclarationConfirmationVariant,
	JointEvaluationSubmittedVariant,
} from "notifications/queue";
import type { DeclarationFsmStatus } from "~/modules/domain";

export type DeclarationConfirmationContext = {
	status: DeclarationFsmStatus | null;
};

// `path_to_select` is the only existing variant that never claims a step the
// company hasn't reached: once a compliance path is chosen but the funnel is
// still open (`corrective_actions_chosen`, `joint_evaluation_chosen`,
// `revised_joint_evaluation_chosen`), the démarche is neither `completed` nor
// `cse_to_deposit` yet, and there is no dedicated variant for "path already
// chosen, still in progress". Falling back to `path_to_select` reads
// stale-backward (the choice looks outstanding when it already happened)
// rather than stale-forward (claiming a step the company hasn't reached).
// A switch with no `default` keeps this exhaustive over
// `DECLARATION_FSM_STATUSES`: an added status fails the build here instead
// of silently picking a variant.
export function selectDeclarationConfirmationVariant(
	context: DeclarationConfirmationContext,
): DeclarationConfirmationVariant {
	switch (context.status) {
		case "awaiting_cse_opinion":
			return "cse_to_deposit";
		case "demarche_completed":
			return "completed";
		case "awaiting_compliance_path_choice":
		case "awaiting_revision_choice":
		case "corrective_actions_chosen":
		case "joint_evaluation_chosen":
		case "revised_joint_evaluation_chosen":
		case "draft":
		case null:
			return "path_to_select";
	}
}

export type JointEvaluationSubmittedContext = {
	hasSecondDeclaration: boolean;
	cseOpinionExpected: boolean;
};

export function selectJointEvaluationSubmittedVariant(
	context: JointEvaluationSubmittedContext,
): JointEvaluationSubmittedVariant {
	if (!context.cseOpinionExpected) return "completed";
	if (context.hasSecondDeclaration) return "cse_first_and_second";
	return "cse_to_deposit";
}

export type CseOpinionReceiptContext = {
	forFirstAndSecondDeclaration: boolean;
	hasGapAboveThreshold: boolean;
};

export function selectCseOpinionReceiptVariant(
	context: CseOpinionReceiptContext,
): CseOpinionReceiptVariant {
	if (context.forFirstAndSecondDeclaration) return "first_and_second";
	if (context.hasGapAboveThreshold) return "with_gap";
	return "single";
}
