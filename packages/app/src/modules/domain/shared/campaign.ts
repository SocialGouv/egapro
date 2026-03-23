/** Returns the current calendar year (declaration campaign year). */
export function getCurrentYear(): number {
	return new Date().getFullYear();
}

/** Returns the CSE opinion year (next calendar year). */
export function getCseYear(): number {
	return new Date().getFullYear() + 1;
}
