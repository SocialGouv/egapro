import "server-only";

import { auth } from "~/server/auth";

type Session = Awaited<ReturnType<typeof auth>>;

/**
 * Per-request deduplication of `auth()` calls.
 *
 * Route handlers instrumented by {@link withAuditedRoute} end up calling
 * `auth()` twice per request — once inside `resolveContext` (to capture the
 * user identity before the handler runs) and once inside the handler itself
 * (for business logic). Without memoisation, that doubles the JWT parsing
 * and cookie reads on every audited route.
 *
 * `cachedAuth(request)` wraps the call in a `WeakMap<Request, Promise<Session>>`
 * so both callers share the same in-flight promise. The `Request` instance is
 * the natural per-request key and is garbage-collected once the response is
 * emitted, releasing the map entry automatically.
 */
const authCache = new WeakMap<Request, Promise<Session>>();

export function cachedAuth(request: Request): Promise<Session> {
	const cached = authCache.get(request);
	if (cached) return cached;
	const promise = auth();
	authCache.set(request, promise);
	return promise;
}
