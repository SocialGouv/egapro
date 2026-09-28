import type { DeclarationFsmStatus } from "../types";
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

export type CseReconciliationInput = CseOpinionRequiredInput & {
	status: DeclarationFsmStatus;
	storedCseRequired: boolean;
};

/**
 * What a démarche owes when its stored CSE requirement no longer matches the
 * company's current headcount and CSE answer.
 *
 * `release` is the case the snapshot cannot recover from on its own: the
 * démarche is parked on the CSE step, the opinion is no longer owed, and only a
 * FSM transition gets it out. Everywhere else the snapshot is simply stale and
 * refreshing it is enough, because the engine reads it downstream.
 *
 * Kept here rather than in the sync service so the per-company path and the
 * post-import batch decide from the same rule — the batch selects a superset in
 * SQL and asks this function, instead of re-expressing the rule as a predicate
 * that could drift from it.
 */
export type CseReconciliationOutcome = "none" | "refresh-snapshot" | "release";

export function resolveCseReconciliation(
	input: CseReconciliationInput,
): CseReconciliationOutcome {
	const cseRequired = isCseOpinionRequired(input);
	if (input.storedCseRequired === cseRequired) return "none";
	if (cseRequired || input.status !== "awaiting_cse_opinion") {
		return "refresh-snapshot";
	}
	return "release";
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
