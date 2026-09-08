/**
 * Fixed validity window of an admin two-factor authentication, in seconds.
 *
 * Counted from the instant ProConnect authenticated the agent, never extended
 * by activity: an agent who authenticated 8 hours ago has to present a second
 * factor again before entering the backoffice, however busy the session was.
 */
export const ADMIN_MFA_WINDOW_SECONDS = 8 * 60 * 60;

/**
 * Authentication context class references accepted as proof that a second
 * factor was presented during *this* authentication.
 *
 * `eidas2` and `eidas3` are deliberately absent: they qualify how thoroughly
 * the identity was verified when the account was created, not whether a second
 * factor was used to sign in. Accepting them would let a strongly-identified
 * password-only account into the backoffice.
 */
export const ADMIN_MFA_ACR_VALUES = ["eidas1-mfa"] as const;

const ADMIN_MFA_ACR_SET: ReadonlySet<string> = new Set(ADMIN_MFA_ACR_VALUES);

/**
 * True when the authentication level returned by the identity provider proves
 * a second factor was presented.
 */
export function isAdminMfaAcr(acr: unknown): boolean {
	return typeof acr === "string" && ADMIN_MFA_ACR_SET.has(acr);
}

/**
 * True when a two-factor authentication dated `adminMfaAt` (seconds since the
 * epoch) is still within the backoffice window at `now`.
 *
 * Pure: the current instant is a parameter so callers — middleware, tRPC
 * guards, tests — all agree on the same clock. An absent date is never fresh.
 * The boundary is exclusive: exactly `ADMIN_MFA_WINDOW_SECONDS` after the
 * authentication, the window has closed.
 *
 * A date slightly in the future stays fresh on purpose. Its only source is the
 * `auth_time` of an identity provider whose clock may run a few seconds ahead
 * of ours; refusing it would send the agent back to ProConnect immediately
 * after a successful second factor, which is the loop this window exists to
 * avoid.
 */
export function isAdminMfaFresh(
	adminMfaAt: number | null | undefined,
	now: Date,
): boolean {
	if (typeof adminMfaAt !== "number" || !Number.isFinite(adminMfaAt)) {
		return false;
	}
	const elapsedSeconds = Math.floor(now.getTime() / 1000) - adminMfaAt;
	return elapsedSeconds < ADMIN_MFA_WINDOW_SECONDS;
}
