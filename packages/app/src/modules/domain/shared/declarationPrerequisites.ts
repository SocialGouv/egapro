/**
 * Returns true if the user has provided all required info to start a declaration (phone + CSE status when the CSE applies).
 *
 * A locked year cannot be asked the question any more — its answer froze with
 * the completed démarche —, so an unanswered locked year is not "missing": the
 * user must still reach the year, not a panel that has nothing to offer.
 */
export function hasRequiredDeclarationInfo(
	userPhone: string | null,
	hasCse: boolean | null,
	cseApplicable: boolean,
	cseLocked: boolean,
): boolean {
	if (!userPhone) return false;
	return !cseApplicable || cseLocked || hasCse !== null;
}
