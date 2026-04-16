import { TRPCError } from "@trpc/server";
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

/**
 * Read-only guard for admin impersonation ("mimoquage").
 *
 * When an admin is impersonating a company, every write path (tRPC mutations,
 * file uploads, create-on-read side effects) must be refused server-side so
 * admins can diagnose issues without altering the user's data. The UI hides
 * these actions too, but this assertion is the source of truth.
 *
 * Throws a `FORBIDDEN` `TRPCError` with a user-facing French message; Route
 * Handlers can catch it and translate to HTTP 403.
 */
export function assertNotImpersonating(session: Session | null): void {
	// Only admins can mint an impersonation in the JWT (see auth/config.ts).
	// Gating on `isAdmin` here too keeps this helper consistent with
	// `isImpersonatingSiren` and prevents a crafted session with a stray
	// `impersonation` field from blocking a legitimate non-admin user.
	if (session?.user?.isAdmin && session.user.impersonation) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message:
				"Mode mimoquage actif : cette action est en lecture seule et ne peut pas être effectuée.",
		});
	}
}
