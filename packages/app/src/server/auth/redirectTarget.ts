const HOME_PATH = "/mon-espace";

// A blob: URL carries the origin of the document that created it, so the origin check alone would let one through.
const NAVIGABLE_PROTOCOLS = new Set(["https:", "http:"]);

function parseAgainst(url: string, base: URL): URL | null {
	try {
		return new URL(url, base);
	} catch {
		return null;
	}
}

export function resolveRedirectTarget(url: string, baseUrl: string): string {
	const base = new URL(baseUrl);
	const home = new URL(HOME_PATH, base).href;
	const target = parseAgainst(url, base);

	if (
		target === null ||
		target.origin !== base.origin ||
		!NAVIGABLE_PROTOCOLS.has(target.protocol) ||
		target.username !== "" ||
		target.password !== ""
	) {
		return home;
	}

	const isSiteRoot = target.pathname === "/" && !target.search && !target.hash;
	return isSiteRoot ? home : target.href;
}
