import { env } from "~/env.js";
import { isAdminMfaFresh } from "~/modules/domain";
import { cachedAuth } from "~/server/audit/cachedAuth";

/**
 * GET handler that throws a test error for Sentry server-side capture.
 * Reserved to admins with a fresh second factor — the same bar as
 * `adminProcedure` — so an anonymous caller cannot burn the Sentry quota;
 * blocked in production regardless.
 */
export async function GET(request: Request) {
	const session = await cachedAuth(request);
	const isFreshAdmin =
		session?.user?.isAdmin === true &&
		isAdminMfaFresh(session.user.adminMfaAt, new Date());

	if (env.NEXT_PUBLIC_EGAPRO_ENV === "prod" || !isFreshAdmin) {
		return Response.json({ error: "Not found" }, { status: 404 });
	}

	throw new Error("Test server error for Sentry integration testing");
}
