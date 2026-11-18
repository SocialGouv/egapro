import { checkDatabaseReadiness } from "~/server/db/readiness";

export const dynamic = "force-dynamic";

// Served behind the catch-all ingress, hence the cache and the single in-flight
// check in `checkDatabaseReadiness`: an anonymous burst cannot turn into a
// flood of `SELECT 1` nor into a readiness flap.
export async function GET(): Promise<Response> {
	const ready = await checkDatabaseReadiness();

	return new Response(ready ? "OK" : "unavailable", {
		status: ready ? 200 : 503,
		headers: { "Cache-Control": "no-store" },
	});
}
