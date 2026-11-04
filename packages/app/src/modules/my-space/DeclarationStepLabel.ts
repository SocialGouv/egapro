// Submodule import, not the barrel — the barrel drags declaration-remuneration's (server-touching) tree into this client bundle.
import { REPRESENTATION_STEPS } from "~/modules/declaration-representation/steps";
import {
	DECLARATION_PROCESS_STEP_LABELS,
	type DeclarationFsmStatus,
	type DeclarationStatus,
	type DeclarationType,
} from "~/modules/domain";

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
	return DECLARATION_PROCESS_STEP_LABELS[d.fsmStatus ?? "draft"];
}
