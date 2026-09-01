import type { Metadata, MetadataRoute } from "next";

const DISALLOWED_PATHS = [
	"/api/",
	"/admin/",
	"/mon-espace/",
	"/declaration-remuneration/",
	"/avis-cse/",
	"/login",
	"/maintenance",
	"/test-",
];

export function buildRobots(
	baseUrl: string,
	isProd: boolean,
): MetadataRoute.Robots {
	// Non-prod environments (dev, preprod, review apps) must not be indexed:
	// returning `Disallow: /` blocks all crawlers and omits the sitemap URL.
	if (!isProd) {
		return {
			rules: [{ userAgent: "*", disallow: "/" }],
		};
	}
	const origin = new URL(baseUrl).origin;
	return {
		rules: [{ userAgent: "*", allow: "/", disallow: DISALLOWED_PATHS }],
		sitemap: `${origin}/sitemap.xml`,
	};
}

/**
 * Page-level indexing directive, paired with `buildRobots`.
 *
 * `Disallow: /` stops crawling but not indexing: a URL discovered through an
 * external link can still be listed without a snippet. Review app URLs are
 * posted on the pull requests of this public repository, so they are exactly
 * that case — hence an explicit `noindex` on every non-prod page. Prod returns
 * `undefined`, which emits no directive and leaves the page indexable.
 */
export function buildMetadataRobots(isProd: boolean): Metadata["robots"] {
	return isProd ? undefined : { follow: false, index: false };
}
