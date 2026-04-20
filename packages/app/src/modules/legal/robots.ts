import type { MetadataRoute } from "next";

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
