import { handler } from "~/server/auth";

type NextAuthRouteContext = { params: Promise<{ nextauth: string[] }> };

// NextAuth feeds an anonymous `POST /_log` body to the `logger`, which writes audit rows.
async function POST(request: Request, context: NextAuthRouteContext) {
	const { nextauth } = await context.params;
	if (nextauth[0] === "_log") {
		return new Response(null, { status: 204 });
	}
	return handler(request, context);
}

export { handler as GET, POST };
