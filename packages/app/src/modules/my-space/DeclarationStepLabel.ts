import type { DeclarationFsmStatus } from "~/modules/domain";

const PROCESS_STEP_LABELS: Record<DeclarationFsmStatus, string> = {
	draft: "Déclaration des indicateurs de rémunération",
	awaiting_compliance_path_choice:
		"(Première déclaration) Choix du parcours de mise en conformité",
	corrective_actions_chosen: "Actions correctives et seconde déclaration",
	awaiting_revision_choice:
		"(Deuxième déclaration) Choix du parcours de mise en conformité",
	joint_evaluation_chosen: "Évaluation conjointe des rémunérations",
	revised_joint_evaluation_chosen: "Évaluation conjointe des rémunérations",
	awaiting_cse_opinion: "Déposer le ou les avis CSE",
	demarche_completed: "Finalisation - Démarche des indicateurs de rémunération",
};

/**
 * Returns a French label describing the current step of the declaration
 * process, derived from the FSM status persisted on the declaration.
 *
 * Returns "Non commencée" when the declaration has not been touched yet
 * (fsmStatus is null, e.g. ghost row materialised on the fly).
 */
export function getDeclarationProcessStepLabel(
	fsmStatus: DeclarationFsmStatus | null,
): string {
	if (fsmStatus === null) return "Non commencée";
	return PROCESS_STEP_LABELS[fsmStatus];
}
