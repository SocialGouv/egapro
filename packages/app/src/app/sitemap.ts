import type { MetadataRoute } from "next";

import { env } from "~/env.js";
import { buildSitemap } from "~/modules/legal";

export default function sitemap(): MetadataRoute.Sitemap {
	return buildSitemap(env.NEXTAUTH_URL);
}
