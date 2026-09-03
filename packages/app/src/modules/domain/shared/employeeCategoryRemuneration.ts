export const MIN_HEADCOUNT_REQUIRING_PAY_DATA = 1;

export function isSexRemunerationComplete(
	headcount: number | undefined,
	payFieldValues: readonly (string | undefined)[],
): boolean {
	const normalizedHeadcount = headcount ?? 0;
	if (
		Number.isNaN(normalizedHeadcount) ||
		normalizedHeadcount < MIN_HEADCOUNT_REQUIRING_PAY_DATA
	) {
		return true;
	}
	return payFieldValues.every((value) => Boolean(value));
}

/** Headcount cells of one job category, one Femmes/Hommes pair per pay basis.
 *  An empty cell is unknown, not zero: only an explicit 0 is a zero. */
export type CategoryHeadcounts = {
	womenCount?: number | null;
	menCount?: number | null;
	hourlyWomenCount?: number | null;
	hourlyMenCount?: number | null;
};

/** Whether a job category declares pay data at all. False as soon as one
 *  headcount cell, on either basis, is an explicit 0 — (0/0), (n/0) or (0/n):
 *  a category missing a sex on a basis has no gap to declare (#3678). */
export function isCategoryPayApplicable(
	headcounts: CategoryHeadcounts,
): boolean {
	return ![
		headcounts.womenCount,
		headcounts.menCount,
		headcounts.hourlyWomenCount,
		headcounts.hourlyMenCount,
	].some((count) => count === 0);
}
