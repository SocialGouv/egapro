import { route, unroutedPath } from "./routeContract";

export const API_UPLOAD = route("/api/upload");
export const API_DECLARATION_PDF = route("/api/declaration-pdf");
export const API_REPRESENTATION_PDF = route("/api/representation-pdf");
export const API_TRANSMITTED_PDF = route("/api/transmitted-pdf");
export const API_PREFILL_PDF = route("/api/prefill-pdf");

export const API_DECLARATION_LOCK_RELEASE = route(
	"/api/declaration-lock/release",
);
export const API_E2E_CLOCK = route("/api/e2e-clock");
export const API_TEST_SENTRY = route("/api/test-sentry");
export const API_AUTH_LOGOUT = route("/api/auth/logout");

// The route itself is `/api/trpc/[trpc]`; this is where the handler is mounted.
export const API_TRPC = unroutedPath("/api/trpc");

// Legacy entry point, redirected to the public API by the middleware.
export const API_SEARCH = unroutedPath("/api/search");

// The middleware matches this prefix to enforce the gateway shared secret; the
// trailing slash is what keeps a hypothetical `/api/v1x` out of it.
export const API_V1_PREFIX = unroutedPath("/api/v1/");

export const API_V1_FILES = route("/api/v1/files");
export const API_V1_EXPORT_DECLARATIONS = route("/api/v1/export/declarations");
export const API_V1_OPENAPI = route("/api/v1/openapi.json");

export function apiV1FileHref(fileId: string) {
	return route(`/api/v1/files/${fileId}` as const);
}

export const API_PUBLIC_DECLARATIONS = route("/api/public/declarations");
export const API_PUBLIC_DECLARATIONS_EXPORT = route(
	"/api/public/declarations/export",
);
export const API_PUBLIC_REPRESENTATIONS = route("/api/public/representations");
export const API_PUBLIC_REPRESENTATIONS_EXPORT = route(
	"/api/public/representations/export",
);
export const API_PUBLIC_OPENAPI = route("/api/public/openapi.json");
