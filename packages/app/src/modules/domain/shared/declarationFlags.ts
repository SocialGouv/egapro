import { GAP_ALERT_THRESHOLD } from "./constants";
import {
	type DeclarationStatusEvent,
	hasSubmittedSecondDeclaration,
} from "./declarationTrajectory";

const PHASE2_SIZE_MIN = 100;

export type DeclarationForFlags = {
	rulesVersion: string | null;
};

export type Phase2RequiredInput = {
	workforce: number | null;
	hasIndicatorG: boolean;
	gap: number | null;
};

export function isPhase2Required(input: Phase2RequiredInput): boolean {
	if (input.workforce === null) return false;
	if (input.gap === null) return false;
	return (
		input.workforce >= PHASE2_SIZE_MIN &&
		input.hasIndicatorG &&
		input.gap >= GAP_ALERT_THRESHOLD
	);
}

export type Phase2RevisionRequiredInput = Phase2RequiredInput & {
	events: ReadonlyArray<DeclarationStatusEvent>;
	correctionGap: number | null;
};

export function isPhase2RevisionRequired(
	input: Phase2RevisionRequiredInput,
): boolean {
	if (!isPhase2Required(input)) return false;
	if (!hasSubmittedSecondDeclaration(input.events)) return false;
	if (input.correctionGap === null) return false;
	return input.correctionGap >= GAP_ALERT_THRESHOLD;
}
