// Liveness only: never read a dependency here. A database or partner outage
// must not restart a pod that serves fine — readiness lives in /api/readyz.
export function GET() {
	return new Response("OK", { status: 200 });
}
