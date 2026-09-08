import { isCseOpinionResolved } from "~/modules/domain";
// `~/modules/routes` is strings only, so the barrel is safe here: unlike the
// declaration-representation barrel it drags no server-touching tree into this
// client bundle.
import {
	COMPLIANCE_JOINT_EVALUATION,
	COMPLIANCE_PATH,
	CSE_OPINION,
	clampRepresentationStep,
	complianceStepHref,
	DECLARATION_REMUNERATION,
	DECLARATION_REPRESENTATION,
	LAST_REPRESENTATION_STEP,
	representationStepHref,
} from "~/modules/routes";
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

// No `?siren=` is appended: every one of these pages resolves the declaration
// from the session (`companyProcedure` binds the SIREN), and none ever read the
// query.
export function computeCtaHref(declaration: DeclarationItem | undefined) {
	const fsmStatus = declaration?.fsmStatus ?? null;
	if (fsmStatus === null) {
		return DECLARATION_REMUNERATION;
	}

	switch (fsmStatus) {
		case "draft":
			return DECLARATION_REMUNERATION;
		case "awaiting_compliance_path_choice":
		case "awaiting_revision_choice":
			return COMPLIANCE_PATH;
		case "corrective_actions_chosen":
			return complianceStepHref(1);
		case "joint_evaluation_chosen":
		case "revised_joint_evaluation_chosen":
			return COMPLIANCE_JOINT_EVALUATION;
		case "awaiting_cse_opinion":
			return CSE_OPINION;
		case "demarche_completed":
			return cseOpinionResolvedFor(declaration)
				? DECLARATION_REMUNERATION
				: CSE_OPINION;
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
) {
	const recapHref = representationStepHref(LAST_REPRESENTATION_STEP);
	if (!campaignOpen) return recapHref;
	if (declaration?.notSubject) return DECLARATION_REPRESENTATION;
	const progress = getRepresentationProgress(declaration);
	if (progress === "submitted") return recapHref;
	if (progress === "draft") {
		return representationStepHref(
			clampRepresentationStep(declaration?.currentStep ?? 1),
		);
	}
	return DECLARATION_REPRESENTATION;
}
