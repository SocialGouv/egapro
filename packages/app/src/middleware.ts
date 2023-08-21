import { config as _config } from "@common/config";
import { StatusCodes } from "http-status-codes";
import { NextResponse } from "next/server";
import { type NextMiddlewareWithAuth, withAuth } from "next-auth/middleware";

const nextMiddleware: NextMiddlewareWithAuth = async req => {
  const { pathname, href } = req.nextUrl;

  if (
    (pathname.startsWith("/apiv2/") || pathname.startsWith("/api/")) &&
    !_config.ff.apiV2.whitelist.some(okPath => pathname.startsWith(okPath)) &&
    !_config.ff.apiV2.enabled
  ) {
    console.log("APIV2 disabled, redirecting 404", pathname);
    return new NextResponse(null, { status: StatusCodes.NOT_FOUND });
  }

  // handling authorization by ourselves (and not with authorize callback)
  const { token } = req.nextauth;
  if (!token?.email) {
    if (_config.api.security.auth.privateRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(`${_config.host}/login?callbackUrl=${encodeURIComponent(href)}`);
    }
  }

  if (_config.api.security.auth.staffRoutes.some(route => pathname.startsWith(route)) && !token?.staff) {
    return new NextResponse(null, { status: StatusCodes.FORBIDDEN });
  }

  return NextResponse.next();
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
