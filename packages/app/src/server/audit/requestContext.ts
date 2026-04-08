import "server-only";

/**
 * Extract the client IP address from request headers, walking the standard
 * forwarded-for chain (most proxies set `x-forwarded-for` as a comma-separated
 * list, with the original client first).
 */
export function extractIpAddress(headers: Headers): string | null {
	const forwardedFor = headers.get("x-forwarded-for");
	if (forwardedFor) {
		const first = forwardedFor.split(",")[0]?.trim();
		if (first) return first;
	}
	const realIp = headers.get("x-real-ip");
	if (realIp) return realIp;
	return null;
}

export function extractUserAgent(headers: Headers): string | null {
	return headers.get("user-agent") ?? null;
}

export type RequestContext = {
	ipAddress: string | null;
	userAgent: string | null;
};

export function buildRequestContext(headers: Headers): RequestContext {
	return {
		ipAddress: extractIpAddress(headers),
		userAgent: extractUserAgent(headers),
	};
}

/**
 * Convert any HeadersInit-like iterable (e.g. `next/headers`'s ReadonlyHeaders)
 * into a standard `Headers` instance so it can be passed to
 * `buildRequestContext`. The forEach callback intentionally returns void.
 */
export function toHeaders(source: {
	forEach: (cb: (value: string, key: string) => void) => void;
}): Headers {
	const target = new Headers();
	source.forEach((value, key) => {
		target.set(key, value);
	});
	return target;
}
