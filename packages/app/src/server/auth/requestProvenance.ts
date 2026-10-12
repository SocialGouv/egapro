const TRUSTED_FETCH_SITES = new Set(["same-origin", "none"]);

function originOf(value: string): string | null {
	try {
		return new URL(value).origin;
	} catch {
		return null;
	}
}

export function isCrossSiteRequest(
	headers: Headers,
	trustedOrigin: string,
): boolean {
	const fetchSite = headers.get("sec-fetch-site");
	if (fetchSite !== null) {
		// The browser computes Sec-Fetch-Site over the whole redirect chain, whereas Referer survives a third-party 302 back to us: once present, it alone decides.
		return !TRUSTED_FETCH_SITES.has(fetchSite);
	}

	const source = headers.get("origin") ?? headers.get("referer");
	if (source === null) {
		// Fail open: legacy browsers without Fetch Metadata must still be able to log out.
		return false;
	}
	return originOf(source) !== trustedOrigin;
}
