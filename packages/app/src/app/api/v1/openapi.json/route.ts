import { NextResponse } from "next/server";

import { openApiSpec } from "~/modules/export/openapi";

export function GET() {
	return NextResponse.json(openApiSpec, {
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Cache-Control": "public, max-age=3600",
		},
	});
}
