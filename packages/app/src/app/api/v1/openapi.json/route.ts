import { NextResponse } from "next/server";

import { env } from "~/env.js";
import { openApiSpec } from "~/modules/export/openapi";

export function GET() {
	if (env.NEXT_PUBLIC_EGAPRO_ENV === "prod") {
		return new NextResponse(null, { status: 404 });
	}

	return NextResponse.json(openApiSpec, {
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Cache-Control": "public, max-age=3600",
		},
	});
}
