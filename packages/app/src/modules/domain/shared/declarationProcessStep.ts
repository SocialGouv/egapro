import type { CampaignDeadlines, DeclarationFsmStatus } from "../types";

export const DECLARATION_PROCESS_STEP_LABELS: Record<
	DeclarationFsmStatus,
	string
> = {
	draft: "Déclaration des indicateurs de rémunération",
	awaiting_compliance_path_choice: "Choix du parcours de mise en conformité",
	corrective_actions_chosen: "Actions correctives et seconde déclaration",
	awaiting_revision_choice:
		"Choix du parcours de mise en conformité (Deuxième déclaration)",
	joint_evaluation_chosen: "Évaluation conjointe des rémunérations",
	revised_joint_evaluation_chosen: "Évaluation conjointe des rémunérations",
	awaiting_cse_opinion: "Transmission du ou des avis du CSE",
	// "Finalisation - " prefix disambiguates the terminal step from step 1 ("Déclaration des indicateurs de rémunération") — only one word apart.
	demarche_completed: "Finalisation - Démarche des indicateurs de rémunération",
};

/**
 * Returns the deadline applicable to the **current step** of the declaration
 * process, derived from the FSM status.
 *
 * Returns `null` when the démarche is finalised (`demarche_completed`) — no
 * deadline applies, the current campaign's row should display "-".
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
			return deadlines.pathChoiceRound1Deadline;
		case "corrective_actions_chosen":
			return deadlines.decl2ModificationDeadline;
		case "awaiting_revision_choice":
			return deadlines.pathChoiceDeadline;
		case "joint_evaluation_chosen":
			return deadlines.decl1JointEvaluationDeadline;
		case "revised_joint_evaluation_chosen":
			return deadlines.decl2JointEvaluationDeadline;
		case "awaiting_cse_opinion":
			return deadlines.decl2CseOpinionDeadline;
		case "demarche_completed":
			return null;
	}
}
