import type { MetadataRoute } from "next";

import { env } from "~/env.js";
import { buildSitemap } from "~/modules/legal";

// Evaluate at request time so NEXTAUTH_URL is read from the deployed env,
// not from the Docker/CI build where SKIP_ENV_VALIDATION leaves it undefined.
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
	return buildSitemap(env.NEXTAUTH_URL, env.NEXT_PUBLIC_EGAPRO_ENV === "prod");
}
