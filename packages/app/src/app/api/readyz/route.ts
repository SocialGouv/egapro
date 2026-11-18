import { checkDatabaseReadiness } from "~/server/db/readiness";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
	const ready = await checkDatabaseReadiness();

	return new Response(ready ? "OK" : "unavailable", {
		status: ready ? 200 : 503,
		headers: { "Cache-Control": "no-store" },
	});
}
