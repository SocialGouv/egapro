/**
 * Derive whether a second declaration was submitted from declaration data.
 * Pure function, easy to unit test.
 */
export function hasSubmittedSecondDeclaration(
	secondDeclarationStatus: string | null,
): boolean {
	return secondDeclarationStatus === "submitted";
}

/**
 * Check if the declaration is in a valid state for the confirmation page.
 */
export function isDeclarationSubmitted(status: string | null): boolean {
	return status === "submitted";
}
