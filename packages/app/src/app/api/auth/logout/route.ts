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
 * dead localhost link. Request headers (`host`, `x-forwarded-host`) are
 * client-controlled and would let anyone forge the redirect target, so the
 * canonical origin comes from configuration only: NEXTAUTH_URL, then the API v2 host.
 */
function getPublicBaseUrl(): string {
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl) {
    try {
      return new URL(nextAuthUrl).origin;
    } catch {
      // Invalid NEXTAUTH_URL: fall back to the configured host.
    }
  }
  return config.host;
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
        // Signature only: an expired session must still end the ProConnect session (id_token_hint).
        return verify(rawToken, decodeSecret, { algorithms: ["HS256"], ignoreExpiration: true }) as JWT;
      } catch {
        return null;
      }
    },
  });

  const baseUrl = getPublicBaseUrl();
  const redirectTarget = await buildLogoutRedirectUrl(token?.id_token ?? null, baseUrl);
  const response = NextResponse.redirect(redirectTarget);
  // Also wipe the drafts persisted in local/session storage (declaration form, funnels) on browsers that support it.
  response.headers.set("Clear-Site-Data", '"storage"');

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
  // post_logout_redirect_uri must exactly match a logout URL registered on the
  // ProConnect FS, which is `${baseUrl}/login` (the IdP rejects anything else
  // with invalid_request "post_logout_redirect_uri not registered"). The session
  // cookie is already cleared above, so landing on /login completes the logout.
  url.searchParams.set("post_logout_redirect_uri", `${baseUrl}/login`);
  return url;
}
