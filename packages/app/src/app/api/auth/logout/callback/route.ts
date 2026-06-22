import { NextResponse } from "next/server";

import { env } from "~/env";

export function GET() {
	const baseUrl = new URL(env.NEXTAUTH_URL).origin;
	return NextResponse.redirect(new URL("/", baseUrl));
}
