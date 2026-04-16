import type { MetadataRoute } from "next";

import { env } from "~/env.js";
import { buildRobots } from "~/modules/legal";

export default function robots(): MetadataRoute.Robots {
	return buildRobots(env.NEXTAUTH_URL);
}
