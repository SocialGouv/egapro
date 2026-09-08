import { sanitizeCallbackUrl } from "~/modules/login";

/** Where an agent is sent when the requested path cannot be trusted. */
export const ADMIN_HOME_PATH = "/admin";

// Segment-aware: `/administration` merely shares a prefix with `/admin` and is
// not a backoffice path.
const BACKOFFICE_PATH = new RegExp(`^${ADMIN_HOME_PATH}([/?#]|$)`);

/**
 * Normalize the `retour` parameter of the resume screen into a backoffice path
 * the resume action may target.
 *
 * Two constraints, both required: the existing `callbackUrl` sanitizer rules
 * out anything that a browser could collapse into a foreign authority, and the
 * `/admin` prefix keeps the resume screen from being turned into a redirector
 * towards any other page of the site. `/administration` is not `/admin`, hence
 * the segment-aware comparison rather than a bare `startsWith`.
 */
export function sanitizeAdminReturnPath(value?: string): string {
	const safe = sanitizeCallbackUrl(value);
	if (!safe || !BACKOFFICE_PATH.test(safe)) return ADMIN_HOME_PATH;

	return safe;
}
