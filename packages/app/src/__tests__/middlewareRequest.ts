import type { NextRequest } from "next/server";

export function nowSeconds(): number {
	return Math.floor(Date.now() / 1000);
}

export function adminToken(elapsed: number) {
	return { id: "u1", isAdmin: true, adminMfaAt: nowSeconds() - elapsed };
}

export function makeRequest(
	pathnameAndSearch = "/admin",
	headers: Record<string, string> = {},
): NextRequest {
	const url = `http://localhost${pathnameAndSearch}`;
	const parsed = new URL(url);
	return {
		url,
		nextUrl: {
			pathname: parsed.pathname,
			search: parsed.search,
			searchParams: parsed.searchParams,
		},
		headers: new Headers(headers),
	} as unknown as NextRequest;
}
