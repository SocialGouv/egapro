import type { Route } from "next";

// Identity at runtime, a proof obligation at build time: with `typedRoutes` on,
// `Route<T>` is the union Next derives from `src/app/`, so a path naming no page
// fails to compile here rather than 404-ing in production. A bare `tsc --noEmit`
// never sees that union — it lives in `.next/types` — so the gate is the build.
export function route<const T extends string>(path: T & Route<T>): T {
	return path;
}

// A path Next generates no type for: a middleware rewrite source, a mount point
// whose page lives one segment deeper, a prefix used for `startsWith`. Named so
// that "unchecked" is greppable rather than invisible.
export function unroutedPath<const T extends string>(path: T): T {
	return path;
}

// A path only the runtime can vouch for — a sanitised `callbackUrl`, a base path
// threaded through a component. An unresolved type parameter stops matching the
// generated union, so the cast lives here once instead of at each call site.
export function runtimeRoute(path: string): Route<string> {
	return path as Route<string>;
}

// The base stays a checked route; only the query, assembled at runtime, is opaque.
export function routeWithQuery(
	path: string,
	query: URLSearchParams | string,
): Route<string> {
	const search = String(query);
	return runtimeRoute(search.length === 0 ? path : `${path}?${search}`);
}
