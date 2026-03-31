/** Returns true if the user has provided all required info to start a declaration (phone + CSE status). */
export function hasRequiredDeclarationInfo(
	userPhone: string | null,
	hasCse: boolean | null,
): boolean {
	return !!userPhone && hasCse !== null;
}
