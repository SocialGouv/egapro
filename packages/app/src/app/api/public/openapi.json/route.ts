import { NextResponse } from "next/server";

import {
	PUBLIC_API_OPENAPI_HEADERS,
	publicOpenApiSpec,
} from "~/modules/public-api";

export function OPTIONS(): Response {
	return new Response(null, {
		status: 204,
		headers: PUBLIC_API_OPENAPI_HEADERS,
	});
}

export function GET(): NextResponse {
	return NextResponse.json(publicOpenApiSpec, {
		headers: PUBLIC_API_OPENAPI_HEADERS,
	});
}
