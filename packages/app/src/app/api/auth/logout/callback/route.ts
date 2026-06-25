import { NextResponse } from "next/server";

/**
 * Resolve the public base URL behind the reverse proxy. `request.url` reflects
 * the internal origin (https://localhost:3000) on Kubernetes; the ingress
 * (Traefik) carries the public values in `x-forwarded-host` / `x-forwarded-proto`.
 */
function getPublicBaseUrl(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${forwardedProto}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}

/**
 * post_logout_redirect_uri target hit by ProConnect after the IdP session is
 * terminated. Sends the user back to the home page.
 */
export function GET(request: Request) {
  const baseUrl = getPublicBaseUrl(request);
  return NextResponse.redirect(new URL("/", baseUrl));
}
