import type { MetadataRoute } from "next";

import { getIndexablePublicPages } from "~/modules/routes";

export const COMPANY_URLS_PER_SITEMAP = 50_000;

// The crawlable pages come from `~/modules/routes`, the same list
// `/plan-du-site` renders — they used to be two hand-kept inventories that
// disagreed. Authenticated areas, internal tools and the declaration funnels
// are excluded by not being public pages at all.
export function buildSitemap(
	baseUrl: string,
	isProd: boolean,
	now: Date = new Date(),
): MetadataRoute.Sitemap {
	// Non-prod environments (dev, preprod, review apps) must not be indexed.
	if (!isProd) return [];
	const origin = new URL(baseUrl).origin;
	return getIndexablePublicPages().map(
		({ path, changeFrequency, priority }) => ({
			url: `${origin}${path === "/" ? "" : path}`,
			lastModified: now,
			changeFrequency,
			priority,
		}),
	);
}
