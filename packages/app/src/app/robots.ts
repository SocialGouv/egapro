import type { MetadataRoute } from "next";

import { env } from "~/env.js";
import { buildRobots } from "~/modules/legal";

// Evaluate at request time so NEXTAUTH_URL is read from the deployed env,
// not from the Docker/CI build where SKIP_ENV_VALIDATION leaves it undefined.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
	return buildRobots(env.NEXTAUTH_URL);
}
