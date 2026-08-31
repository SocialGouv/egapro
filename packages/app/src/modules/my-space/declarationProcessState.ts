// Submodule imports, not the barrel — the barrel drags declaration-remuneration's (server-touching) tree into this client bundle.
import {
	REPRESENTATION_FUNNEL_ROOT,
	stepHref,
} from "~/modules/declaration-representation/steps";
import { TOTAL_REPRESENTATION_STEPS } from "~/modules/declaration-representation/types";
import { isCseOpinionResolved } from "~/modules/domain";
import type { PanelVariant } from "./DeclarationProcessPanel";
import type { DeclarationItem } from "./types";

function cseOpinionResolvedFor(
	declaration: DeclarationItem | undefined,
): boolean {
	if (!declaration) return true;
	return isCseOpinionResolved({
		cseRequired: declaration.cseRequired,
		hasSubmittedCseOpinion: declaration.hasSubmittedCseOpinion,
	});
}

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
			return cseOpinionResolvedFor(declaration) ? "closed" : "cse";
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
			return cseOpinionResolvedFor(declaration)
				? `/declaration-remuneration?siren=${siren}`
				: `/avis-cse?siren=${siren}`;
	}
}

export type RepresentationPanelVariant =
	| "start"
	| "draft"
	| "submitted"
	| "not_subject"
	| "closed";

// Representation has no FSM yet — progression is this 3-bucket DeclarationItem.status.
type RepresentationProgress = "not_started" | "draft" | "submitted";

function getRepresentationProgress(
	declaration: DeclarationItem | undefined,
): RepresentationProgress {
	if (declaration?.status === "done") return "submitted";
	if (declaration?.status === "in_progress") return "draft";
	return "not_started";
}

export function computeRepresentationPanelVariant(
	declaration: DeclarationItem | undefined,
	campaignOpen: boolean,
): RepresentationPanelVariant {
	if (!campaignOpen) return "closed";
	if (declaration?.notSubject) return "not_subject";
	const progress = getRepresentationProgress(declaration);
	return progress === "not_started" ? "start" : progress;
}

export function computeRepresentationCtaHref(
	declaration: DeclarationItem | undefined,
	campaignOpen: boolean,
): string {
	if (!campaignOpen) return stepHref(TOTAL_REPRESENTATION_STEPS);
	if (declaration?.notSubject) return REPRESENTATION_FUNNEL_ROOT;
	const progress = getRepresentationProgress(declaration);
	if (progress === "submitted") return stepHref(TOTAL_REPRESENTATION_STEPS);
	if (progress === "draft") {
		return stepHref(Math.max(declaration?.currentStep ?? 1, 1));
	}
	return REPRESENTATION_FUNNEL_ROOT;
}
