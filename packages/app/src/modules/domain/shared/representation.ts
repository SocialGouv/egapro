export const REPRESENTATION_TARGET_INITIAL = 30;
export const REPRESENTATION_TARGET_RAISED = 40;
export const REPRESENTATION_TARGET_RAISED_FROM_CAMPAIGN_YEAR = 2029;

export type RepresentationComplianceVerdict =
	| "compliant"
	| "non_compliant"
	| "not_applicable";

export type ExecutivesCount = "none" | "one" | "two_or_more";

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
