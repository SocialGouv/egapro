import { COMPANY_SIZE_ANNUAL_MIN } from "./constants";
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
	hasSignificantIndicatorGGap: boolean;
};

export function isComplianceProcessRequired(
	input: ComplianceProcessRequiredInput,
): boolean {
	if (input.workforce === null) return false;
	return (
		input.workforce >= COMPANY_SIZE_ANNUAL_MIN &&
		input.hasIndicatorG &&
		input.hasSignificantIndicatorGGap
	);
}

export type ComplianceProcessRevisionRequiredInput =
	ComplianceProcessRequiredInput & {
		events: ReadonlyArray<DeclarationStatusEvent>;
		hasSignificantCorrectionIndicatorGGap: boolean;
	};

export function isComplianceProcessRevisionRequired(
	input: ComplianceProcessRevisionRequiredInput,
): boolean {
	if (!isComplianceProcessRequired(input)) return false;
	if (!hasSubmittedSecondDeclaration(input.events)) return false;
	return input.hasSignificantCorrectionIndicatorGGap;
}
