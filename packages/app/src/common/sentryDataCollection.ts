import { type init } from "@sentry/nextjs";

type DataCollection = NonNullable<NonNullable<Parameters<typeof init>[0]>["dataCollection"]>;

/**
 * Sentry v11 collects user info, cookies, headers, bodies and query strings by default:
 * keep the SDK to stack traces and the explicit context we attach (no session cookie, no
 * `Authorization` header, no declaration payload leaves the platform).
 */
export const SENTRY_DATA_COLLECTION: DataCollection = {
  cookies: false,
  httpBodies: [],
  httpHeaders: false,
  urlQueryParams: false,
  userInfo: false,
};
