import { GAP_ALERT_THRESHOLD } from "./constants";
import {
	type DeclarationStatusEvent,
	hasSubmittedSecondDeclaration,
} from "./declarationTrajectory";

const COMPLIANCE_PROCESS_SIZE_MIN = 100;

export type DeclarationForFlags = {
	rulesVersion: string | null;
};

export type ComplianceProcessRequiredInput = {
	workforce: number | null;
	hasIndicatorG: boolean;
	gap: number | null;
};

export function isComplianceProcessRequired(
	input: ComplianceProcessRequiredInput,
): boolean {
	if (input.workforce === null) return false;
	if (input.gap === null) return false;
	return (
		input.workforce >= COMPLIANCE_PROCESS_SIZE_MIN &&
		input.hasIndicatorG &&
		input.gap >= GAP_ALERT_THRESHOLD
	);
}

export type ComplianceProcessRevisionRequiredInput =
	ComplianceProcessRequiredInput & {
		events: ReadonlyArray<DeclarationStatusEvent>;
		correctionGap: number | null;
	};

export function isComplianceProcessRevisionRequired(
	input: ComplianceProcessRevisionRequiredInput,
): boolean {
	if (!isComplianceProcessRequired(input)) return false;
	if (!hasSubmittedSecondDeclaration(input.events)) return false;
	if (input.correctionGap === null) return false;
	return input.correctionGap >= GAP_ALERT_THRESHOLD;
}
