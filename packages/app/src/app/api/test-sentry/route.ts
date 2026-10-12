import { env } from "~/env.js";
import { resolveAdminAccess } from "~/modules/domain";
import { cachedAuth } from "~/server/audit/cachedAuth";

// Same bar as the `/admin` surface, so an anonymous caller cannot burn the Sentry quota.
export async function GET(request: Request) {
	const session = await cachedAuth(request);
	const isFreshAdmin =
		resolveAdminAccess(session?.user, new Date()).type === "allow";

	if (env.NEXT_PUBLIC_EGAPRO_ENV === "prod" || !isFreshAdmin) {
		return Response.json({ error: "Not found" }, { status: 404 });
	}

	throw new Error("Test server error for Sentry integration testing");
}
