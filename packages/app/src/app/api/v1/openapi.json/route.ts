import { NextResponse } from "next/server";

import { env } from "~/env.js";
import { openApiSpec } from "~/modules/export";

export function GET() {
	if (env.NEXT_PUBLIC_EGAPRO_ENV === "prod") {
		return new NextResponse(null, { status: 404 });
	}

	return NextResponse.json(openApiSpec, {
		headers: {
			// Public read-only spec — intentionally open to all origins.
			"Access-Control-Allow-Origin": "*",
			"Cache-Control": "public, max-age=3600",
		},
	});
}
