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
