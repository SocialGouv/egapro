import { sanitizeCallbackUrl } from "~/modules/login";

export const ADMIN_HOME_PATH = "/admin";

// Segment-aware: `/administration` merely shares a prefix with `/admin`.
const BACKOFFICE_PATH = new RegExp(`^${ADMIN_HOME_PATH}([/?#]|$)`);

// Dummy base, as in the callback sanitizer: nothing of it reaches the result.
const RESOLUTION_ORIGIN = "https://internal.invalid";

export function sanitizeAdminReturnPath(value?: string): string {
	const safe = sanitizeCallbackUrl(value);
	if (!safe) return ADMIN_HOME_PATH;

	// `/admin/../mon-espace` opens with `/admin` as a string, yet every consumer collapses it to `/mon-espace` before requesting it.
	const resolved = new URL(safe, RESOLUTION_ORIGIN);
	const normalized = `${resolved.pathname}${resolved.search}${resolved.hash}`;

	// Without this confinement the resume screen becomes a redirector towards any page of the site.
	if (!BACKOFFICE_PATH.test(normalized)) return ADMIN_HOME_PATH;

	return normalized;
}
