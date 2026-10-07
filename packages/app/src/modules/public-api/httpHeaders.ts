const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

export const PUBLIC_API_EXPORT_HEADERS = {
	...CORS_HEADERS,
	"Cache-Control": "public, max-age=3600, s-maxage=3600",
} as const;

export const PUBLIC_API_OPENAPI_HEADERS = {
	...CORS_HEADERS,
	"Cache-Control": "public, max-age=3600, must-revalidate",
} as const;
