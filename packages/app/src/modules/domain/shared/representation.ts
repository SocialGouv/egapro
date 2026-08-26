import type { DeclarationStatus } from "../types";

export const REPRESENTATION_TARGET_INITIAL = 30;
export const REPRESENTATION_TARGET_RAISED = 40;
export const REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR = 2029;
export const REPRESENTATION_SUBJECTION_WORKFORCE_MIN = 1000;
export const REPRESENTATION_SUBJECTION_WINDOW_YEARS = 3;

export type RepresentationComplianceVerdict =
	| "compliant"
	| "non_compliant"
	| "not_applicable";

export type ExecutivesCount = "none" | "one" | "two_or_more";

export type WorkforceHistoryEntry = { year: number; workforceEma: number };

export function getRepresentationTarget(campaignYear: number): number {
	return campaignYear >= REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR
		? REPRESENTATION_TARGET_RAISED
		: REPRESENTATION_TARGET_INITIAL;
}

export function computeRepresentationVerdict(
	womenPercent: number | null,
	menPercent: number | null,
	campaignYear: number,
): RepresentationComplianceVerdict {
	if (womenPercent === null || menPercent === null) return "not_applicable";
	const target = getRepresentationTarget(campaignYear);
	return Math.min(womenPercent, menPercent) >= target
		? "compliant"
		: "non_compliant";
}

export function deriveExecutivesNotComputableReason(
	count: ExecutivesCount,
): "aucun_cadre_dirigeant" | "un_seul_cadre_dirigeant" | null {
	if (count === "none") return "aucun_cadre_dirigeant";
	if (count === "one") return "un_seul_cadre_dirigeant";
	return null;
}

export function getRepresentationCampaignYear(referenceYear: number): number {
	return referenceYear + 1;
}

export function isPresumedSubjectToRepresentation(
	workforcesByYear: WorkforceHistoryEntry[],
	referenceYear: number,
): boolean {
	const window = workforcesByYear
		.filter((entry) => entry.year <= referenceYear)
		.sort((a, b) => b.year - a.year)
		.slice(0, REPRESENTATION_SUBJECTION_WINDOW_YEARS);

	if (window.length === 0) return true;

	return window.every(
		(entry) => entry.workforceEma >= REPRESENTATION_SUBJECTION_WORKFORCE_MIN,
	);
}

export function isRepresentationPublicationRequired(
	executivesCount: ExecutivesCount,
	hasManagementBody: boolean,
): boolean {
	return executivesCount === "two_or_more" || hasManagementBody === true;
}

export type RepresentationDeclarationStatus =
	| "draft"
	| "not_subject"
	| "submitted";

export function isRepresentationDeclarationSubmitted(
	status: RepresentationDeclarationStatus | null | undefined,
): boolean {
	return status === "submitted";
}

export function isRepresentationNotSubject(
	status: RepresentationDeclarationStatus | null | undefined,
): boolean {
	return status === "not_subject";
}

export function computeRepresentationDeclarationStatus(declaration: {
	status: RepresentationDeclarationStatus;
	currentStep: number | null;
}): DeclarationStatus {
	if (
		isRepresentationNotSubject(declaration.status) ||
		isRepresentationDeclarationSubmitted(declaration.status)
	)
		return "done";
	return (declaration.currentStep ?? 0) === 0 ? "to_complete" : "in_progress";
}
