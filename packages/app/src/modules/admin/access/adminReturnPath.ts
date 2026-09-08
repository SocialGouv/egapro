import { sanitizeCallbackUrl } from "~/modules/login";

export const ADMIN_HOME_PATH = "/admin";

// Segment-aware: `/administration` merely shares a prefix with `/admin`.
const BACKOFFICE_PATH = new RegExp(`^${ADMIN_HOME_PATH}([/?#]|$)`);

// Dummy base, as in the callback sanitizer: nothing of it reaches the result.
const RESOLUTION_ORIGIN = "https://internal.invalid";

// Shared by both exports below so a traversal segment resolves the same way
// for whichever one is asked: `/mon-espace/../admin` must not test as
// backoffice-bound for `sanitizeAdminReturnPath` while testing as such (or
// the reverse) for `isAdminReturnPath` — one normalization, not two.
function resolveSameOriginPath(value: string): string | undefined {
	if (!value.startsWith("/")) return undefined;
	try {
		const resolved = new URL(value, RESOLUTION_ORIGIN);
		if (resolved.origin !== RESOLUTION_ORIGIN) return undefined;
		return `${resolved.pathname}${resolved.search}${resolved.hash}`;
	} catch {
		return undefined;
	}
}

export function sanitizeAdminReturnPath(value?: string): string {
	const safe = sanitizeCallbackUrl(value);
	if (!safe) return ADMIN_HOME_PATH;

	const normalized = resolveSameOriginPath(safe);

	// Without this confinement the resume screen becomes a redirector towards any page of the site.
	if (!normalized || !isAdminReturnPath(normalized)) return ADMIN_HOME_PATH;

	return normalized;
}

// Used by the login form to decide whether its ProConnect request must carry
// the step-up requirement, on a value that has not been through
// `sanitizeAdminReturnPath` — so it normalizes traversal itself rather than
// trusting the caller's raw string.
export function isAdminReturnPath(value: string): boolean {
	const normalized = resolveSameOriginPath(value);
	return normalized !== undefined && BACKOFFICE_PATH.test(normalized);
}
