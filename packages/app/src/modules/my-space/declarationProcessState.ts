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
		compliancePath,
		secondDeclarationStatus,
		complianceCompletedAt,
		hasCseOpinion,
		hasJointEvaluationFile,
	} = declaration;

	if (!compliancePath) {
		return "start";
	}

	if (complianceCompletedAt) {
		return hasCseOpinion ? "closed" : "cse";
	}

	if (compliancePath === "corrective_action") {
		if (secondDeclarationStatus === "submitted") {
			return "evaluation";
		}
		return "compliance";
	}

	if (compliancePath === "joint_evaluation") {
		if (hasJointEvaluationFile) {
			return "cse";
		}
		return "evaluation";
	}

	if (compliancePath === "justify") {
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
		compliancePath,
		secondDeclarationStatus,
		complianceCompletedAt,
		hasCseOpinion,
		hasJointEvaluationFile,
	} = declaration;

	if (!compliancePath) {
		return `/declaration-remuneration/parcours-conformite?siren=${siren}`;
	}

	if (complianceCompletedAt) {
		if (hasCseOpinion) {
			return `/declaration-remuneration?siren=${siren}`;
		}
		return `/avis-cse?siren=${siren}`;
	}

	if (compliancePath === "corrective_action") {
		if (secondDeclarationStatus === "submitted") {
			return `/declaration-remuneration/parcours-conformite?siren=${siren}`;
		}
		return `/declaration-remuneration/parcours-conformite/etape/1?siren=${siren}`;
	}

	if (compliancePath === "joint_evaluation") {
		if (hasJointEvaluationFile) {
			return `/avis-cse?siren=${siren}`;
		}
		return `/declaration-remuneration/parcours-conformite/evaluation-conjointe?siren=${siren}`;
	}

	if (compliancePath === "justify") {
		return `/avis-cse?siren=${siren}`;
	}

	return `/declaration-remuneration?siren=${siren}`;
}
