import { COMPANY_SIZE_ANNUAL_MIN, GAP_ALERT_THRESHOLD } from "./constants";
import {
	type DeclarationStatusEvent,
	hasSubmittedSecondDeclaration,
} from "./declarationTrajectory";

export type DeclarationForFlags = {
	rulesVersion: string | null;
};

export type CseOpinionRequiredInput = {
	workforce: number;
	hasCse: boolean | null;
};

/**
 * Whether the démarche actually owes a CSE opinion.
 *
 * Mirrors the `cseRequired` fact of the rule engine (`server/rules/*.json`):
 * being large enough for the CSE obligation is not sufficient, the company must
 * also have a CSE. `isCseRequired` answers the size question alone — it says
 * whether the CSE field applies, not whether an opinion is due.
 */
export function isCseOpinionRequired(input: CseOpinionRequiredInput): boolean {
	return input.workforce >= COMPANY_SIZE_ANNUAL_MIN && input.hasCse === true;
}

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
		input.workforce >= COMPANY_SIZE_ANNUAL_MIN &&
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
