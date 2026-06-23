import { fetchEndSessionEndpoint } from "@api/core-domain/infra/auth/proconnect-logout";
import { config } from "@common/config";
import { verify } from "jsonwebtoken";
import { type NextRequest, NextResponse } from "next/server";
import { getToken, type JWT } from "next-auth/jwt";

const secret = config.api.security.auth.secret;

/**
 * Resolve the public base URL behind the reverse proxy. On Kubernetes
 * `request.url` reflects the internal origin (https://localhost:3000), which
 * makes ProConnect reject the post_logout_redirect_uri and sends the user to a
 * dead localhost link. The ingress (Traefik) sets `x-forwarded-host` /
 * `x-forwarded-proto` with the public values, so prefer those.
 */
function getPublicBaseUrl(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${forwardedProto}://${forwardedHost}`;
  }
  return new URL(request.url).origin;
}

/**
 * RP-initiated logout. Reads the (custom HS256) session token to recover the
 * ProConnect id_token, clears the local NextAuth cookie, and redirects to the
 * ProConnect end_session_endpoint so the IdP session is terminated too.
 * Without this, ProConnect keeps its session and the next login is silently
 * re-authenticated on the previous organization.
 */
export async function GET(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret,
    decode: async ({ token: rawToken, secret: decodeSecret }) => {
      if (!rawToken) {
        return null;
      }
      try {
        return verify(rawToken, decodeSecret, { algorithms: ["HS256"] }) as JWT;
      } catch {
        return null;
      }
    },
  });

  const baseUrl = getPublicBaseUrl(request);
  const redirectTarget = await buildLogoutRedirectUrl(token?.id_token ?? null, baseUrl);
  const response = NextResponse.redirect(redirectTarget);

  const isSecure = baseUrl.startsWith("https://");
  const sessionCookieName = isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token";
  response.cookies.set(sessionCookieName, "", {
    expires: new Date(0),
    path: "/",
    secure: isSecure,
    httpOnly: true,
    sameSite: "lax",
  });

  return response;
}

async function buildLogoutRedirectUrl(idToken: string | null, baseUrl: string): Promise<URL> {
  if (!idToken) {
    return new URL("/", baseUrl);
  }
  const endSessionEndpoint = await fetchEndSessionEndpoint();
  if (!endSessionEndpoint) {
    return new URL("/", baseUrl);
  }
  const url = new URL(endSessionEndpoint);
  url.searchParams.set("id_token_hint", idToken);
  url.searchParams.set("post_logout_redirect_uri", `${baseUrl}/api/auth/logout/callback`);
  return url;
}
