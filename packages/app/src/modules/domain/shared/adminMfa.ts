// Counted from the authentication itself and never extended by activity: a
// busy session does not keep the backoffice open past the window.
export const ADMIN_MFA_WINDOW_SECONDS = 8 * 60 * 60;

// `eidas2` and `eidas3` are excluded on purpose: they qualify how thoroughly
// the identity was verified at enrolment, not whether a second factor was
// presented at this sign-in.
export const ADMIN_MFA_ACR_VALUES = ["eidas1-mfa"] as const;

const ADMIN_MFA_ACR_SET: ReadonlySet<string> = new Set(ADMIN_MFA_ACR_VALUES);

export function isAdminMfaAcr(acr: unknown): boolean {
	return typeof acr === "string" && ADMIN_MFA_ACR_SET.has(acr);
}

export function isAdminMfaFresh(
	adminMfaAt: number | null | undefined,
	now: Date,
): boolean {
	if (typeof adminMfaAt !== "number" || !Number.isFinite(adminMfaAt)) {
		return false;
	}
	const elapsedSeconds = Math.floor(now.getTime() / 1000) - adminMfaAt;
	// A date slightly ahead of our clock stays fresh: it comes from the identity
	// provider's `auth_time`, and refusing it would bounce the agent straight
	// back to ProConnect after a successful second factor.
	return elapsedSeconds < ADMIN_MFA_WINDOW_SECONDS;
}

// Read from the session alone: a reason carried in the URL would be displayable at will.
export type AdminMfaFailure = "expired" | "missing";

export type AdminAccessDecision =
	| { type: "login" }
	| { type: "monEspace" }
	| { type: "resume"; reason: AdminMfaFailure }
	| { type: "allow" };

// `isAdmin` is optional because a token minted before the field existed carries no value, which is not `false`.
export type AdminSessionState = {
	isAdmin?: boolean;
	adminMfaAt?: number | null;
};

// The single decision table of the `/admin` surface: Edge middleware, backoffice layout and resume screen all run this one.
export function resolveAdminAccess(
	session: AdminSessionState | null | undefined,
	now: Date,
): AdminAccessDecision {
	// A token predating the admin field cannot be judged; only a fresh sign-in produces one that can.
	if (!session || session.isAdmin === undefined) return { type: "login" };

	if (!session.isAdmin) return { type: "monEspace" };

	if (!isAdminMfaFresh(session.adminMfaAt, now)) {
		return {
			type: "resume",
			reason:
				typeof session.adminMfaAt === "number" &&
				Number.isFinite(session.adminMfaAt)
					? "expired"
					: "missing",
		};
	}

	return { type: "allow" };
}
