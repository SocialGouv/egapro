import { handler } from "~/server/auth";

type NextAuthRouteContext = { params: Promise<{ nextauth: string[] }> };

// NextAuth replays an anonymous, unthrottled `POST /_log` body into the server
// `logger`, whose `error` writes an `auth.login_failed` audit row: anyone could
// forge failed-login rows at will. Client beacons are dropped here instead.
async function POST(request: Request, context: NextAuthRouteContext) {
	const { nextauth } = await context.params;
	if (nextauth.join("/") === "_log") {
		return new Response(null, { status: 204 });
	}
	return handler(request, context);
}

export { handler as GET, POST };
