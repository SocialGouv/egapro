import "server-only";

import { isIP } from "node:net";

const IP_ADDRESS_MAX_LENGTH = 45;

function validIpAddress(value: string | undefined): string | null {
	const candidate = value?.trim();
	if (!candidate || candidate.length > IP_ADDRESS_MAX_LENGTH) return null;
	return isIP(candidate) === 0 ? null : candidate;
}

// The first x-forwarded-for entry is whatever the client sent; only x-real-ip
// (set by the ingress) and the last entry (appended by our own proxy) are
// trustworthy. Bounded to the audit `ip_address` varchar(45) column, whose
// overflow would make the audit insert fail silently.
export function extractIpAddress(headers: Headers): string | null {
	const realIp = headers.get("x-real-ip");
	if (realIp?.trim()) return validIpAddress(realIp);
	return validIpAddress(headers.get("x-forwarded-for")?.split(",").at(-1));
}

export function extractUserAgent(headers: Headers): string | null {
	return headers.get("user-agent")?.trim() ?? null;
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
