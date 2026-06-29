import type { DeclarationFsmStatus, DeclarationType } from "~/modules/domain";

const PROCESS_STEP_LABELS: Record<DeclarationFsmStatus, string> = {
	draft: "Déclaration des indicateurs de rémunération",
	awaiting_compliance_path_choice: "Choix du parcours de mise en conformité",
	corrective_actions_chosen: "Actions correctives et seconde déclaration",
	awaiting_revision_choice:
		"Choix du parcours de mise en conformité (Deuxième déclaration)",
	joint_evaluation_chosen: "Évaluation conjointe des rémunérations",
	revised_joint_evaluation_chosen: "Évaluation conjointe des rémunérations",
	awaiting_cse_opinion: "Déposer le ou les avis CSE",
	// "Finalisation - " prefix disambiguates the terminal step from step 1
	// ("Déclaration des indicateurs de rémunération") — only one word apart.
	demarche_completed: "Finalisation - Démarche des indicateurs de rémunération",
};

export function getDeclarationProcessStepLabel(d: {
	type: DeclarationType;
	fsmStatus: DeclarationFsmStatus | null;
}): string {
	if (d.type === "representation") return "Non commencée";
	return PROCESS_STEP_LABELS[d.fsmStatus ?? "draft"];
}
