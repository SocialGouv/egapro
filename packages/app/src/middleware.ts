import { config as _config } from "@common/config";
import { StatusCodes } from "http-status-codes";
import { NextResponse } from "next/server";
import { type NextMiddlewareWithAuth, withAuth } from "next-auth/middleware";

const cspMiddleware = () => {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const cspHeader = `
    default-src 'self' https://*.gouv.fr;
    connect-src 'self' https://*.gouv.fr;
    font-src 'self' data: blob:;
    media-src 'self' https://*.gouv.fr;
    img-src 'self' data: https://*.gouv.fr;
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${
      process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""
    };
    frame-src 'self' https://*.gouv.fr;
    style-src 'self' https://*.gouv.fr 'nonce-${nonce}';
    frame-ancestors 'self' https://*.gouv.fr;
    object-src 'none';
    base-uri 'self' https://*.gouv.fr;
    form-action 'self' https://*.gouv.fr;
    block-all-mixed-content;
    upgrade-insecure-requests;
    require-trusted-types-for 'script';
    trusted-types react-dsfr react-dsfr-asap nextjs#bundler;`;

  const requestHeaders = new Headers();
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set(
    "Content-Security-Policy",
    // Replace newline characters and spaces
    cspHeader.replace(/\s{2,}/g, " ").trim(),
  );

  return NextResponse.next({
    headers: requestHeaders,
    request: {
      headers: requestHeaders,
    },
  });
};

const nextMiddleware: NextMiddlewareWithAuth = async req => {
  const { pathname, href } = req.nextUrl;

  // handling authorization by ourselves (and not with authorize callback)
  const { token } = req.nextauth;
  if (!token?.email) {
    if (_config.api.security.auth.privateRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(`${_config.host}/login?callbackUrl=${encodeURIComponent(href)}`);
    }
  }

  const isStaff = token?.user.staff || token?.staff.impersonating || false;
  if (_config.api.security.auth.staffRoutes.some(route => pathname.startsWith(route)) && !isStaff) {
    return new NextResponse(null, { status: StatusCodes.FORBIDDEN });
  }

  return cspMiddleware();
};

// export const middleware = nextMiddleware;
export const middleware = withAuth(
  // Next Middleware
  nextMiddleware,
  // Next auth config - will run **before** middleware
  {
    secret: _config.api.security.auth.secret,
    callbacks: {
      authorized: () => true,
    },
  },
);

// eslint-disable-next-line import/no-default-export -- don't know why since 13.4.4 next need a default import in addition to named one
export default middleware;
