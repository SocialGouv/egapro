import type { MetadataRoute } from "next";

const DISALLOWED_PATHS = [
	"/api/",
	"/admin/",
	"/mon-espace/",
	"/declaration-remuneration/",
	"/avis-cse/",
	"/login",
	"/maintenance",
	"/test-error",
	"/test-panel",
];

export function buildRobots(baseUrl: string): MetadataRoute.Robots {
	const origin = new URL(baseUrl).origin;
	return {
		rules: [{ userAgent: "*", allow: "/", disallow: DISALLOWED_PATHS }],
		sitemap: `${origin}/sitemap.xml`,
	};
}
