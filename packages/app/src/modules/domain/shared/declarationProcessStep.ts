import type { CampaignDeadlines, DeclarationFsmStatus } from "../types";

/**
 * Returns the deadline applicable to the **current step** of the declaration
 * process, derived from the FSM status.
 *
 * Returns `null` when the démarche is finalised (`demarche_completed`) — no
 * deadline applies, the row should display "Clôturée".
 *
 * The mapping aligns with the deadlines surfaced by the my-space
 * `VerticalStepper` (kept consistent so the table cell and the panel agree).
 */
export function getDeclarationProcessStepDeadline(
	fsmStatus: DeclarationFsmStatus | null,
	deadlines: CampaignDeadlines,
): Date | null {
	if (fsmStatus === null) return deadlines.decl1ModificationDeadline;

	switch (fsmStatus) {
		case "draft":
			return deadlines.decl1ModificationDeadline;
		case "awaiting_compliance_path_choice":
			return deadlines.decl2ModificationDeadline;
		case "corrective_actions_chosen":
			return deadlines.decl2ModificationDeadline;
		case "awaiting_revision_choice":
			return deadlines.decl2JointEvaluationDeadline;
		case "joint_evaluation_chosen":
			return deadlines.decl1JointEvaluationDeadline;
		case "revised_joint_evaluation_chosen":
			return deadlines.decl2JointEvaluationDeadline;
		case "awaiting_cse_opinion":
			return deadlines.decl2JointEvaluationDeadline;
		case "demarche_completed":
			return null;
	}
}
