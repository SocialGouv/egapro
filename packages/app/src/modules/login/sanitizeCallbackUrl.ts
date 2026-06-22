export function sanitizeCallbackUrl(value?: string): string | undefined {
	if (!value) return undefined;
	if (!value.startsWith("/")) return undefined;
	// Reject protocol-relative URLs (`//evil.com`, `/\evil.com`) which the
	// browser resolves to a different origin — defense in depth against
	// open-redirect on top of the NextAuth `redirect` callback.
	if (value.startsWith("//") || value.startsWith("/\\")) return undefined;
	return value;
}
