import type { CampaignDeadlines, RepresentationCampaign } from "../types";
import { readCampaignYearOverride } from "./campaignClock";
import { formatIsoDate, formatLongDate } from "./format";

/** Returns the current campaign year: the E2E recette override when a grid run
 * pinned one (see campaignClock.ts — test-only, inert in production), the
 * calendar year otherwise. */
export function getCurrentYear(): number {
	return readCampaignYearOverride() ?? new Date().getFullYear();
}

/** Returns the reference year for a given campaign year (N-1: a declaration reports the prior year's data). */
export function getReferenceYearFor(campaignYear: number): number {
	return campaignYear - 1;
}

/** Returns the workforce reference year for the current campaign (previous calendar year, as INSEE publishes N-1 data). */
export function getWorkforceYear(): number {
	return getReferenceYearFor(getCurrentYear());
}

/** Representation-declaration deadline for a campaign year (March 1st), display format DD/MM/YYYY. */
export function getRepresentationDeadline(year: number): string {
	return `01/03/${year}`;
}

/** Regulatory reference period of a declaration campaign: the civil year preceding the campaign (N-1, as a declaration reports the prior year's data), format "DD/MM/YYYY - DD/MM/YYYY". */
export function getReferencePeriod(campaignYear: number): string {
	const referenceYear = getReferenceYearFor(campaignYear);
	return `01/01/${referenceYear} - 31/12/${referenceYear}`;
}

/**
 * Declaration recap reference period, format "DD/MM/YYYY - DD/MM/YYYY".
 *
 * A second declaration lets the user enter a custom reference period at step 2
 * (`secondDeclReferencePeriodStart`/`End`, persisted as `YYYY-MM-DD`) instead of
 * the campaign's civil year. Recap surfaces must display that persisted period —
 * falling back to the civil-year period for initial declarations and for second
 * declarations predating mandatory capture (both columns null).
 */
export function getDeclarationReferencePeriod(
	campaignYear: number,
	isSecondDeclaration: boolean,
	secondDeclReferencePeriodStart: string | null | undefined,
	secondDeclReferencePeriodEnd: string | null | undefined,
): string {
	if (
		isSecondDeclaration &&
		secondDeclReferencePeriodStart &&
		secondDeclReferencePeriodEnd
	) {
		return `${formatIsoDate(secondDeclReferencePeriodStart)} - ${formatIsoDate(secondDeclReferencePeriodEnd)}`;
	}
	return getReferencePeriod(campaignYear);
}

/** Returns the declaration modification deadline for a given year: `"1ᵉʳ juin 2027"`. */
export function getDeclarationDeadline(year: number): string {
	return formatLongDate(new Date(year, 5, 1));
}

/** Returns the second declaration modification deadline for a given year: `"1ᵉʳ décembre 2027"`. */
export function getSecondDeclarationDeadline(year: number): string {
	return formatLongDate(new Date(year, 11, 1));
}

/** Returns the derived deadline to choose a compliance path (January 1st of the following year). */
export function getPathChoiceDeadline(year: number): Date {
	return new Date(year + 1, 0, 1);
}

/** Returns the derived round-1 deadline to choose a compliance path (July 1st of the campaign year). */
export function getPathChoiceRound1Deadline(year: number): Date {
	return new Date(year, 6, 1);
}

/**
 * Returns the deadline to choose a compliance path for the round the company is in.
 *
 * Display only — never feed a read-only gate or a write guard with it: the path
 * choice stays open past the round-1 date (see CompliancePathPage).
 */
export function selectPathChoiceDeadline(
	deadlines: CampaignDeadlines,
	isSecondRound: boolean,
): Date {
	return isSecondRound
		? deadlines.pathChoiceDeadline
		: deadlines.pathChoiceRound1Deadline;
}

/** Returns default campaign deadlines for a given year (fallback when no DB config exists). */
export function getDefaultCampaignDeadlines(year: number): CampaignDeadlines {
	return {
		gipPublicationDate: null,
		campaignStartDate: null,
		decl1ModificationDeadline: new Date(year, 5, 1),
		decl1JustificationDeadline: new Date(year + 1, 2, 1),
		decl1JointEvaluationDeadline: new Date(year, 7, 1),
		decl2ModificationDeadline: new Date(year, 11, 1),
		decl2JustificationDeadline: new Date(year, 11, 1),
		decl2JointEvaluationDeadline: new Date(year + 1, 1, 1),
		pathChoiceDeadline: getPathChoiceDeadline(year),
		pathChoiceRound1Deadline: getPathChoiceRound1Deadline(year),
	};
}

export function getDefaultRepresentationCampaign(
	campaignYear: number,
): RepresentationCampaign {
	return {
		campaignStartDate: new Date(campaignYear, 0, 1),
		campaignEndDate: new Date(campaignYear, 11, 31),
		declarationDeadline: new Date(campaignYear, 2, 1),
	};
}

export function isRepresentationCampaignOpen(
	campaign: RepresentationCampaign,
	now: Date,
): boolean {
	return (
		now.getTime() >= campaign.campaignStartDate.getTime() &&
		now.getTime() <= campaign.campaignEndDate.getTime()
	);
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
