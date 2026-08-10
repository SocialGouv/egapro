import { TRPCError } from "@trpc/server";
import type { Session } from "next-auth";

import { extractSiren } from "~/modules/domain";

/**
 * Resolve the SIREN to display/load for the current session.
 *
 * - Admin currently impersonating a company → the impersonated SIREN.
 * - Regular user → the SIREN extracted from their ProConnect SIRET.
 * - Anyone without either → `null`, and the caller decides how to bail
 *   (redirect, `<MissingSiret/>`, etc.).
 *
 * Shared across every page/layout that renders company-scoped UI so every
 * surface behaves identically during mimoquage (issue #3230).
 */
export function getEffectiveSiren(session: Session | null): string | null {
	if (!session?.user) return null;
	if (session.user.isAdmin && session.user.impersonation) {
		return session.user.impersonation.siren;
	}
	return session.user.siret ? extractSiren(session.user.siret) : null;
}

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
 * Is the current session an admin actively impersonating a company
 * ("mimoquage") ?
 *
 * Read-only surfaces use it to relax user-data prerequisites an admin cannot
 * fill in (phone number, CSE answer); write surfaces go through
 * `assertNotImpersonating` instead.
 *
 * Gating on `isAdmin` blocks a crafted session carrying a stray
 * `impersonation` field.
 */
export function isImpersonating(session: Session | null): boolean {
	return Boolean(session?.user?.isAdmin && session.user.impersonation);
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
	if (isImpersonating(session)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message:
				"Mode mimoquage actif : cette action est en lecture seule et ne peut pas être effectuée.",
		});
	}
}
