/** Returns true if the user has provided all required info to start a declaration (phone + CSE status when the CSE applies). */
export function hasRequiredDeclarationInfo(
	userPhone: string | null,
	hasCse: boolean | null,
	cseApplicable: boolean,
): boolean {
	return !!userPhone && (!cseApplicable || hasCse !== null);
}
