import { logger } from "@api/utils/pino";
import { config as _config } from "@common/config";
import { captureError } from "@common/error";
import { StatusCodes } from "http-status-codes";
import * as jose from "jose";
import { NextResponse } from "next/server";
import { type JWT } from "next-auth/jwt";
import { type NextMiddlewareWithAuth, withAuth } from "next-auth/middleware";

/**
 * Per-request nonce: Next.js reads it from the `Content-Security-Policy` request header and tags its
 * own inline scripts with it, the root layout forwards `x-nonce` to react-dsfr and Matomo.
 */
const generateNonce = () => btoa(crypto.randomUUID());

/**
 * Scripts must carry the request nonce or come from a trusted host: no `'unsafe-inline'`, so an
 * injected `<script>` never runs. Styles keep `'unsafe-inline'` because the DSFR and React set
 * `style` attributes, which no nonce can cover.
 * In development, Next injects `eval`-based HMR scripts, hence `'unsafe-eval'` there only.
 */
export const buildCspHeader = (nonce: string, isDevelopment = process.env.NODE_ENV === "development") =>
  `
    default-src 'self' https://*.gouv.fr;
    connect-src 'self' https://*.gouv.fr;
    font-src 'self' data: blob:;
    media-src 'self' https://*.gouv.fr;
    img-src 'self' data: https://*.gouv.fr;
    script-src 'self' https://*.gouv.fr 'nonce-${nonce}'${isDevelopment ? " 'unsafe-eval'" : ""};
    frame-src 'self' https://*.gouv.fr;
    style-src 'self' https://*.gouv.fr 'unsafe-inline';
    worker-src 'self' blob:;
    frame-ancestors 'self' https://*.gouv.fr;
    object-src 'none';
    base-uri 'self' https://*.gouv.fr;
    form-action 'self' https://*.gouv.fr;
    block-all-mixed-content;
    upgrade-insecure-requests; `
    // Replace newline characters and spaces
    .replace(/\s{2,}/g, " ")
    .trim();

const cspMiddleware: NextMiddlewareWithAuth = req => {
  // Always overwrite the request headers: Next.js reads the nonce from the inbound
  // `Content-Security-Policy` header, a client-supplied value must never reach the renderer
  // (GHSA-ffhc-5mcf-pf4q, nonce reflection, only fixed in Next 15.5).
  const nonce = generateNonce();

  const responseHeaders = new Headers();
  responseHeaders.set("x-nonce", nonce);
  responseHeaders.set("Content-Security-Policy", buildCspHeader(nonce));

  const requestHeaders = new Headers(req.headers);
  responseHeaders.forEach((value, key) => {
    requestHeaders.set(key, value);
  });

  return NextResponse.next({
    headers: responseHeaders,
    request: {
      headers: requestHeaders,
    },
  });
};

// Never ship credentials to Sentry.
const SENSITIVE_HEADERS = ["authorization", "cookie", "proxy-authorization", "set-cookie", "x-api-key", "api-key"];

const safeHeaders = (headers: Headers) =>
  Object.fromEntries([...headers.entries()].filter(([key]) => !SENSITIVE_HEADERS.includes(key.toLowerCase())));

const nextMiddleware: NextMiddlewareWithAuth = async (req, event) => {
  try {
    const { pathname } = req.nextUrl;
    const href = `${_config.host}${pathname}${req.nextUrl.search}`;

    // handling authorization by ourselves (and not with authorize callback)
    const { token } = req.nextauth;
    if (!token?.email) {
      if (_config.api.security.auth.privateRoutes.some(route => pathname.startsWith(route))) {
        return NextResponse.redirect(`${_config.host}/login?callbackUrl=${encodeURIComponent(href)}`);
      }
    }

    const isStaff = token?.user?.staff || token?.staff?.impersonating || false;
    if (_config.api.security.auth.staffRoutes.some(route => pathname.startsWith(route)) && !isStaff) {
      return new NextResponse(null, { status: StatusCodes.FORBIDDEN });
    }

    return cspMiddleware(req, event);
  } catch (error) {
    captureError(error, {
      type: "middleware",
      url: req.url,
      method: req.method,
      path: req.nextUrl.pathname,
      headers: safeHeaders(req.headers),
    });

    // Return a generic error response
    return new NextResponse(null, {
      status: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};

// Create the wrapped middleware with error handling
const wrappedMiddleware = withAuth(
  // Next Middleware
  nextMiddleware,
  // Next auth config - will run **before** middleware
  {
    secret: _config.api.security.auth.secret,
    jwt: {
      async decode({ token, secret }): Promise<JWT | null> {
        try {
          const secretAsKey = new TextEncoder().encode(secret as string);
          // `exp` is required: a session signed before expiry was enforced would otherwise never expire.
          return (
            await jose.jwtVerify(token as string, secretAsKey, { algorithms: ["HS256"], requiredClaims: ["exp"] })
          ).payload as JWT;
        } catch (error) {
          // Never log the error object: jose's JWTExpired/JWTClaimValidationFailed carry the decoded claims.
          logger.error(
            { error: { name: (error as Error)?.name, code: (error as { code?: string })?.code } },
            "Error while decoding token",
          );
          return null;
        }
      },
    },
    callbacks: {
      authorized: () => true,
    },
  },
);

// Next.js requires both named and default exports for middleware
// eslint-disable-next-line import/no-default-export
export default wrappedMiddleware;
export const middleware = wrappedMiddleware;

// Config to exclude Sentry tunnel route from middleware
export const config = {
  matcher: ["/((?!api/monitoring/envelope).*)"],
};
