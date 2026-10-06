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
	if (fetchSite !== null && TRUSTED_FETCH_SITES.has(fetchSite)) {
		return false;
	}

	const source = headers.get("origin") ?? headers.get("referer");
	if (source === null) {
		// Fail open: legacy browsers without Fetch Metadata must still be able to log out.
		return fetchSite !== null;
	}
	return originOf(source) !== trustedOrigin;
}
