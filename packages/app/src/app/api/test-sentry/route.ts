import { env } from "~/env.js";

/** GET handler that throws a test error for Sentry server-side capture. Blocked in production. */
export function GET() {
	if (env.NEXT_PUBLIC_EGAPRO_ENV === "prod") {
		return Response.json(
			{ error: "Not available in production" },
			{ status: 404 },
		);
	}

	throw new Error("Test server error for Sentry integration testing");
}
