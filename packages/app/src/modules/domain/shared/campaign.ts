/** Returns the current calendar year (declaration campaign year). */
export function getCurrentYear(): number {
	return new Date().getFullYear();
}

/** Returns the CSE opinion year (next calendar year). */
export function getCseYear(): number {
	return new Date().getFullYear() + 1;
}

/** Returns the declaration modification deadline for a given year. */
export function getDeclarationDeadline(year: number): string {
	return `1\u1D49\u02B3 juin ${year}`;
}

/** Returns the second declaration modification deadline for a given year. */
export function getSecondDeclarationDeadline(year: number): string {
	return `1 décembre ${year}`;
}
