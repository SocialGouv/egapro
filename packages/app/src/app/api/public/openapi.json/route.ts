import { NextResponse } from "next/server";

import { publicOpenApiSpec } from "~/modules/public-api";

const HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
	"Cache-Control": "public, max-age=3600, must-revalidate",
};

export function OPTIONS(): Response {
	return new Response(null, { status: 204, headers: HEADERS });
}

export function GET(): NextResponse {
	return NextResponse.json(publicOpenApiSpec, { headers: HEADERS });
}
