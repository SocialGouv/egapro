import type { Session } from "next-auth";

/**
 * Centralized rule for "can this authenticated user read/write data scoped
 * to the given company?".
 *
 * Two cases grant access:
 *   1. The user owns the SIREN via `app_user_company` (normal case — the
 *      caller still has to run the ownership query, this function only
 *      encodes the admin-impersonation short-circuit).
 *   2. The user is an admin currently impersonating *exactly* this SIREN.
 *
 * Returning `true` here means the ownership check should be skipped; callers
 * must still run the query when this returns `false`.
 *
 * The `siren` comparison is strict equality — an admin impersonating SIREN
 * A cannot read SIREN B "in passing".
 */
export function isImpersonatingSiren(
	session: Session | null,
	siren: string,
): boolean {
	if (!session?.user?.isAdmin) return false;
	return session.user.impersonation?.siren === siren;
}
