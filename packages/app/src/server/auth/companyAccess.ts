import { TRPCError } from "@trpc/server";
import type { Session } from "next-auth";

import { isAdminMfaFresh, parseSiren } from "~/modules/domain";

type ActiveImpersonation = NonNullable<Session["user"]["impersonation"]>;

/**
 * The impersonation this session may actually act on, or `null`.
 *
 * Two conditions, and the second is the one issue #4466 adds: the account is
 * an admin, and its second factor is still inside the window. Impersonation
 * *is* an administrator privilege — it makes an agent read a company they are
 * not the referent of. Letting an expired window keep resolving a foreign
 * SIREN would hand back through the side door exactly what the `/admin` pages
 * and the administration procedures refuse once the window closes.
 *
 * Every predicate below reads the impersonation through this function, so the
 * freshness rule is decided in one place: the next surface that consumes a
 * mimoquage inherits it instead of forgetting to re-implement it.
 */
function activeImpersonation(
	session: Session | null,
	now: Date,
): ActiveImpersonation | null {
	if (!session?.user?.isAdmin) return null;
	if (!isAdminMfaFresh(session.user.adminMfaAt, now)) return null;
	return session.user.impersonation ?? null;
}

/**
 * Resolve the SIREN to display/load for the current session.
 *
 * - Admin with an effective impersonation → the impersonated SIREN.
 * - Regular user, or admin whose window has expired → the SIREN parsed from
 *   their own ProConnect SIRET.
 * - Anyone without either → `null`, and the caller decides how to bail
 *   (redirect, `<MissingSiret/>`, etc.).
 *
 * The SIRET is read through `parseSiren`, which validates shape and length:
 * a malformed SIRET yields `null` and the caller's "missing SIRET" branch,
 * never a truncated string used as a query key.
 *
 * Shared across every page/layout and the tRPC company procedure so every
 * surface behaves identically during mimoquage (issue #3230).
 */
export function getEffectiveSiren(
	session: Session | null,
	now: Date = new Date(),
): string | null {
	if (!session?.user) return null;
	const impersonation = activeImpersonation(session, now);
	if (impersonation) return impersonation.siren;
	return parseSiren(session.user.siret);
}

/**
 * Centralized rule for "can this authenticated user read/write data scoped
 * to the given company?".
 *
 * Two cases grant access:
 *   1. The user owns the SIREN via `app_user_company` (normal case — the
 *      caller still has to run the ownership query, this function only
 *      encodes the admin-impersonation short-circuit).
 *   2. The user is an admin whose impersonation is effective — inside the
 *      MFA window — and targets *exactly* this SIREN.
 *
 * Returning `true` here means the ownership check should be skipped; callers
 * must still run the query when this returns `false`. An admin out of window
 * therefore falls back to the ownership query and is refused a company they
 * are not a referent of, which is the intended outcome.
 *
 * The `siren` comparison is strict equality — an admin impersonating SIREN
 * A cannot read SIREN B "in passing".
 */
export function isImpersonatingSiren(
	session: Session | null,
	siren: string,
	now: Date = new Date(),
): boolean {
	return activeImpersonation(session, now)?.siren === siren;
}

/**
 * Is the current session an admin with an effective impersonation
 * ("mimoquage") ?
 *
 * Read-only surfaces use it to relax user-data prerequisites an admin cannot
 * fill in (phone number, CSE answer); write surfaces go through
 * `assertNotImpersonating` instead.
 *
 * Gating on `isAdmin` blocks a crafted session carrying a stray
 * `impersonation` field; gating on the MFA window keeps this predicate in
 * step with `getEffectiveSiren` — a session that no longer resolves the
 * impersonated SIREN must not still be treated as impersonating.
 */
export function isImpersonating(
	session: Session | null,
	now: Date = new Date(),
): boolean {
	return activeImpersonation(session, now) !== null;
}

/**
 * Read-only guard for admin impersonation ("mimoquage").
 *
 * When an admin is impersonating a company, every write path (tRPC mutations,
 * file uploads, create-on-read side effects) must be refused server-side so
 * admins can diagnose issues without altering the user's data. The UI hides
 * these actions too, but this assertion is the source of truth.
 *
 * The read-only rule itself is unchanged by #4466: an effective mimoquage
 * still refuses every write. An admin whose window has expired simply has no
 * effective mimoquage left — they write as an ordinary declarant, and only on
 * their own SIREN, since `getEffectiveSiren` has stopped resolving anyone
 * else's.
 *
 * Throws a `FORBIDDEN` `TRPCError` with a user-facing French message; Route
 * Handlers can catch it and translate to HTTP 403.
 */
export function assertNotImpersonating(
	session: Session | null,
	now: Date = new Date(),
): void {
	if (isImpersonating(session, now)) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message:
				"Mode mimoquage actif : cette action est en lecture seule et ne peut pas être effectuée.",
		});
	}
}
