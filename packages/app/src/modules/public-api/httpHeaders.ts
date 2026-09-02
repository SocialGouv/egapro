const CORS_HEADERS = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization",
} as const;

export const PUBLIC_API_SEARCH_HEADERS = {
	...CORS_HEADERS,
	"Cache-Control": "public, max-age=300, stale-while-revalidate=60",
} as const;

export const PUBLIC_API_RESOURCE_HEADERS = {
	...CORS_HEADERS,
	"Cache-Control": "public, max-age=300, s-maxage=300",
} as const;

export const PUBLIC_API_EXPORT_HEADERS = {
	...CORS_HEADERS,
	"Cache-Control": "public, max-age=3600, s-maxage=3600",
} as const;

export const PUBLIC_API_OPENAPI_HEADERS = {
	...CORS_HEADERS,
	"Cache-Control": "public, max-age=3600, must-revalidate",
} as const;
