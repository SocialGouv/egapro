// Dummy base used purely to resolve relative paths; any value rejected by
// `URL` parsing, or resolving to a different origin, is treated as unsafe.
const DUMMY_ORIGIN = "https://internal.invalid";

/**
 * Returns `value` only when it is a safe, same-origin relative path; otherwise
 * `undefined`. Defense in depth against open-redirect on top of the NextAuth
 * `redirect` callback — the page-level redirect of an already-authenticated
 * user bypasses that callback, so this guard is the only one on that path.
 *
 * Blocks absolute URLs, protocol-relative paths (`//evil.com`, `/\evil.com`)
 * and their percent-encoded variants (`/%2F%2Fevil.com` decodes to
 * `///evil.com`, `/%5Cevil.com` to `/\evil.com`), which a browser can collapse
 * into a foreign authority. Malformed percent-encoding is rejected outright.
 */
export function sanitizeCallbackUrl(value?: string): string | undefined {
	if (!value?.startsWith("/")) return undefined;

	// Decode once so percent-encoded protocol-relative bypasses are caught by
	// the same check as their literal forms.
	let decoded: string;
	try {
		decoded = decodeURIComponent(value);
	} catch {
		return undefined;
	}
	if (/^\/[/\\]/.test(value) || /^\/[/\\]/.test(decoded)) return undefined;

	// Final guard: the value must resolve to our own origin and nothing else.
	try {
		if (new URL(value, DUMMY_ORIGIN).origin !== DUMMY_ORIGIN) return undefined;
	} catch {
		return undefined;
	}

	return value;
}
