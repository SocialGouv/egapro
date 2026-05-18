import type { PanelVariant } from "./DeclarationProcessPanel";
import type { DeclarationItem } from "./types";

export function computePanelVariant(
	declaration: DeclarationItem | undefined,
): PanelVariant {
	const fsmStatus = declaration?.fsmStatus ?? null;
	if (fsmStatus === null) {
		return "start";
	}

	switch (fsmStatus) {
		case "draft":
			return "start";
		case "awaiting_compliance_path_choice":
		case "awaiting_revision_choice":
			return "compliance_choice";
		case "corrective_actions_chosen":
			return "compliance";
		case "joint_evaluation_chosen":
		case "revised_joint_evaluation_chosen":
			return "evaluation";
		case "awaiting_cse_opinion":
			return "cse";
		case "demarche_completed":
			return declaration?.hasSubmittedCseOpinion ? "closed" : "cse";
	}
}

export function computeCtaHref(
	declaration: DeclarationItem | undefined,
	siren: string,
): string {
	const fsmStatus = declaration?.fsmStatus ?? null;
	if (fsmStatus === null) {
		return `/declaration-remuneration?siren=${siren}`;
	}

	switch (fsmStatus) {
		case "draft":
			return `/declaration-remuneration?siren=${siren}`;
		case "awaiting_compliance_path_choice":
		case "awaiting_revision_choice":
			return `/declaration-remuneration/parcours-conformite?siren=${siren}`;
		case "corrective_actions_chosen":
			return `/declaration-remuneration/parcours-conformite/etape/1?siren=${siren}`;
		case "joint_evaluation_chosen":
		case "revised_joint_evaluation_chosen":
			return `/declaration-remuneration/parcours-conformite/evaluation-conjointe?siren=${siren}`;
		case "awaiting_cse_opinion":
			return `/avis-cse?siren=${siren}`;
		case "demarche_completed":
			return declaration?.hasSubmittedCseOpinion
				? `/declaration-remuneration?siren=${siren}`
				: `/avis-cse?siren=${siren}`;
	}
}
