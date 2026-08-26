// Submodule import, not the barrel — the barrel drags declaration-remuneration's (server-touching) tree into this client bundle.
import { REPRESENTATION_STEPS } from "~/modules/declaration-representation/steps";
import type {
	DeclarationFsmStatus,
	DeclarationStatus,
	DeclarationType,
} from "~/modules/domain";

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

const REPRESENTATION_START_LABEL = "Vérification de l'assujettissement";

function getRepresentationStepLabel(
	status: DeclarationStatus,
	currentStep: number,
	notSubject: boolean,
): string {
	if (notSubject) {
		return "Non-assujetti";
	}
	if (status === "done") {
		return "Finalisation - Démarche des indicateurs de représentation";
	}
	if (status === "to_complete") {
		return REPRESENTATION_START_LABEL;
	}
	return (
		REPRESENTATION_STEPS[currentStep - 1]?.title ?? REPRESENTATION_START_LABEL
	);
}

export function getDeclarationProcessStepLabel(d: {
	type: DeclarationType;
	fsmStatus: DeclarationFsmStatus | null;
	status: DeclarationStatus;
	currentStep: number;
	notSubject: boolean;
}): string {
	if (d.type === "representation") {
		return getRepresentationStepLabel(d.status, d.currentStep, d.notSubject);
	}
	return PROCESS_STEP_LABELS[d.fsmStatus ?? "draft"];
}
