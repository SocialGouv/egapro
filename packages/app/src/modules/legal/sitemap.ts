import type { MetadataRoute } from "next";

type PublicRoute = {
	path: string;
	changeFrequency: NonNullable<
		MetadataRoute.Sitemap[number]["changeFrequency"]
	>;
	priority: number;
};

/**
 * Publicly crawlable routes. Authenticated areas (/mon-espace, /admin),
 * internal tools (/test-*, /maintenance) and dynamic declaration flows are
 * intentionally excluded per issue #3233.
 */
const PUBLIC_ROUTES: readonly PublicRoute[] = [
	{ path: "/", changeFrequency: "monthly", priority: 1 },
	{ path: "/aide", changeFrequency: "monthly", priority: 0.8 },
	{ path: "/aide/nous-contacter", changeFrequency: "yearly", priority: 0.5 },
	{ path: "/faq", changeFrequency: "monthly", priority: 0.8 },
	{ path: "/referents", changeFrequency: "monthly", priority: 0.7 },
	{ path: "/mentions-legales", changeFrequency: "yearly", priority: 0.3 },
	{ path: "/donnees-personnelles", changeFrequency: "yearly", priority: 0.3 },
	{ path: "/gestion-des-cookies", changeFrequency: "yearly", priority: 0.3 },
	{
		path: "/declaration-accessibilite",
		changeFrequency: "yearly",
		priority: 0.3,
	},
	{ path: "/plan-du-site", changeFrequency: "yearly", priority: 0.3 },
];

export function buildSitemap(
	baseUrl: string,
	isProd: boolean,
	now: Date = new Date(),
): MetadataRoute.Sitemap {
	// Non-prod environments (dev, preprod, review apps) must not be indexed.
	if (!isProd) return [];
	const origin = new URL(baseUrl).origin;
	return PUBLIC_ROUTES.map(({ path, changeFrequency, priority }) => ({
		url: `${origin}${path === "/" ? "" : path}`,
		lastModified: now,
		changeFrequency,
		priority,
	}));
}
