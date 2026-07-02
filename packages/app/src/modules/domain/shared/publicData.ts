/**
 * Returns `true` if the data for a campaign year is publicly visible.
 *
 * A year is considered released when a `releaseDate` has been set **and**
 * `today` is on or after that date.  When `releaseDate` is `null` the year
 * has never been explicitly released, so the safe default is `false` (no
 * accidental publication).
 */
export function isYearPubliclyReleased(
	releaseDate: Date | null,
	today: Date,
): boolean {
	if (releaseDate === null) return false;
	return today >= releaseDate;
}
