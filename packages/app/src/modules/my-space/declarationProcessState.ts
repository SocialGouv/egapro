import type { PanelVariant } from "./DeclarationProcessPanel";
import type { DeclarationItem } from "./types";

/**
 * Determine the panel variant from the current year's remuneration declaration.
 *
 * - "start": not submitted yet
 * - "compliance": submitted with gaps, second declaration in progress
 * - "evaluation": evaluation conjointe in progress
 * - "cse": compliance completed, CSE deposit step
 * - "closed": everything done
 */
export function computePanelVariant(
	declaration: DeclarationItem | undefined,
): PanelVariant {
	if (
		!declaration ||
		declaration.status === "to_complete" ||
		declaration.status === "in_progress"
	) {
		return "start";
	}

	const {
		firstDeclarationPathChoice,
		secondDeclarationSubmittedAt,
		demarcheCompletedAt,
		cseOpinionCompletedAt,
		hasJointEvaluationFile,
	} = declaration;

	if (!firstDeclarationPathChoice) {
		return "compliance_choice";
	}

	if (cseOpinionCompletedAt) {
		return "closed";
	}

	if (demarcheCompletedAt) {
		return "cse";
	}

	if (firstDeclarationPathChoice === "corrective_action") {
		if (secondDeclarationSubmittedAt !== null) {
			return "evaluation";
		}
		return "compliance";
	}

	if (firstDeclarationPathChoice === "joint_evaluation") {
		if (hasJointEvaluationFile) {
			return "cse";
		}
		return "evaluation";
	}

	if (firstDeclarationPathChoice === "justify") {
		return "cse";
	}

	return "start";
}

/**
 * Determine the CTA href based on the panel variant and compliance state.
 */
export function computeCtaHref(
	declaration: DeclarationItem | undefined,
	siren: string,
): string {
	if (!declaration || declaration.status !== "done") {
		return `/declaration-remuneration?siren=${siren}`;
	}

	const {
		firstDeclarationPathChoice,
		secondDeclarationSubmittedAt,
		demarcheCompletedAt,
		cseOpinionCompletedAt,
		hasJointEvaluationFile,
	} = declaration;

	if (!firstDeclarationPathChoice) {
		return `/declaration-remuneration/parcours-conformite?siren=${siren}`;
	}

	if (demarcheCompletedAt) {
		if (cseOpinionCompletedAt) {
			return `/declaration-remuneration?siren=${siren}`;
		}
		return `/avis-cse?siren=${siren}`;
	}

	if (firstDeclarationPathChoice === "corrective_action") {
		if (secondDeclarationSubmittedAt !== null) {
			return `/declaration-remuneration/parcours-conformite?siren=${siren}`;
		}
		return `/declaration-remuneration/parcours-conformite/etape/1?siren=${siren}`;
	}

	if (firstDeclarationPathChoice === "joint_evaluation") {
		if (hasJointEvaluationFile) {
			return `/avis-cse?siren=${siren}`;
		}
		return `/declaration-remuneration/parcours-conformite/evaluation-conjointe?siren=${siren}`;
	}

	if (firstDeclarationPathChoice === "justify") {
		return `/avis-cse?siren=${siren}`;
	}

	return `/declaration-remuneration?siren=${siren}`;
}
