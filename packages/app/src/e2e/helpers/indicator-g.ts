import {
	getCurrentYear,
	getObligationWorkforce,
	isIndicatorGRequired,
} from "~/modules/domain";

/**
 * Whether the funnel presents the indicator G step for a GIP-MDS workforce, on the
 * campaign year the app itself uses (`declaration.year` is `getCurrentYear()`).
 *
 * The mandatory tiers below 250 owe indicator G only on the triennial cadence, and from
 * 2030 that cadence reaches every tier >= 50 — so their funnel shape flips with the
 * calendar (5 steps in 2029, 6 in 2030, 5 again in 2031, 6 in 2033). Reading the
 * expectation from the domain pins a spec to the arbitrage rather than to the year it
 * was written in, which is what makes it survive the cadence instead of turning red for
 * a whole year and reading like a flake.
 */
export function indicatorGRequiredForGip(gipWorkforce: number | null): boolean {
	return indicatorGRequiredForGipInYear(gipWorkforce, getCurrentYear());
}

/**
 * Same question, for a campaign year the caller pins itself (`withCampaignYear`).
 *
 * `indicatorGRequiredForGip` reads `getCurrentYear()` in the Playwright process,
 * which the fixture does not pin — it pins the Node server and the browser. A
 * pinned spec must therefore state its year here, or it would compare the app's
 * pinned funnel against a calendar-year expectation.
 */
export function indicatorGRequiredForGipInYear(
	gipWorkforce: number | null,
	year: number,
): boolean {
	return isIndicatorGRequired(getObligationWorkforce(gipWorkforce), year);
}

/** Steps the funnel presents: the indicator G categories step is dropped when not owed. */
export function funnelStepCount(indicatorGRequired: boolean): number {
	return indicatorGRequired ? 6 : 5;
}

/** Stepper label of the review step, always the last one of the funnel. */
export function recapStepperLabel(indicatorGRequired: boolean): string {
	const total = funnelStepCount(indicatorGRequired);
	return `Étape ${total} sur ${total}`;
}
