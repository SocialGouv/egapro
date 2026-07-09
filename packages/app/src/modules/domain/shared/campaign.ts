import type { CampaignDeadlines } from "../types";

/** Returns the current calendar year (declaration campaign year). */
export function getCurrentYear(): number {
	return new Date().getFullYear();
}

/** Returns the workforce/reference year for a given campaign year (N-1: a declaration reports the prior year's data). */
export function getWorkforceYearFor(campaignYear: number): number {
	return campaignYear - 1;
}

/** Returns the workforce reference year for the current campaign (previous calendar year, as INSEE publishes N-1 data). */
export function getWorkforceYear(): number {
	return getWorkforceYearFor(getCurrentYear());
}

/** Representation-declaration deadline for a campaign year (March 1st), display format DD/MM/YYYY. */
export function getRepresentationDeadline(year: number): string {
	return `01/03/${year}`;
}

/** Regulatory reference period of a declaration year: the full civil year, format "DD/MM/YYYY - DD/MM/YYYY". */
export function getReferencePeriod(year: number): string {
	return `01/01/${year} - 31/12/${year}`;
}

/** Returns the declaration modification deadline for a given year. */
export function getDeclarationDeadline(year: number): string {
	return `1\u1D49\u02B3 juin ${year}`;
}

/** Returns the second declaration modification deadline for a given year. */
export function getSecondDeclarationDeadline(year: number): string {
	return `1 décembre ${year}`;
}

/** Returns the derived deadline to choose a compliance path (January 1st of the following year). */
export function getPathChoiceDeadline(year: number): Date {
	return new Date(year + 1, 0, 1);
}

/** Returns default campaign deadlines for a given year (fallback when no DB config exists). */
export function getDefaultCampaignDeadlines(year: number): CampaignDeadlines {
	return {
		gipPublicationDate: null,
		campaignStartDate: null,
		decl1ModificationDeadline: new Date(year, 5, 1),
		decl1JustificationDeadline: new Date(year, 5, 1),
		decl1JointEvaluationDeadline: new Date(year, 7, 1),
		decl2ModificationDeadline: new Date(year, 11, 1),
		decl2JustificationDeadline: new Date(year, 11, 1),
		decl2JointEvaluationDeadline: new Date(year + 1, 1, 1),
		pathChoiceDeadline: getPathChoiceDeadline(year),
	};
}

/** Returns true if the given deadline is strictly in the past. */
export function isDeadlinePassed(
	deadline: Date,
	now: Date = new Date(),
): boolean {
	return now.getTime() > deadline.getTime();
}

/**
 * Decides whether a submitted declaration step should redirect to its recap.
 *
 * Redirect happens only when:
 * - the declaration is submitted,
 * - the user is not already on the recap step,
 * - the modification deadline has passed.
 */
export function shouldRedirectSubmittedToRecap(params: {
	status: string | null;
	step: number;
	recapStep: number;
	modificationDeadline: Date;
	now?: Date;
}): boolean {
	const { status, step, recapStep, modificationDeadline, now } = params;
	if (status === null || status === "draft") return false;
	if (step === recapStep) return false;
	return isDeadlinePassed(modificationDeadline, now);
}
