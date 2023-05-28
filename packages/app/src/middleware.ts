import { authBaseConfig } from "@api/core-domain/infra/auth/config";
import { config as _config } from "@common/config";
import { StatusCodes } from "http-status-codes";
import { NextResponse } from "next/server";
import { type NextMiddlewareWithAuth, withAuth } from "next-auth/middleware";

const nextMiddleware: NextMiddlewareWithAuth = async req => {
  const { pathname } = req.nextUrl;
  if (
    (pathname.startsWith("/apiv2/") || pathname.startsWith("/api/")) &&
    !_config.ff.apiV2.whitelist.some(okPath => pathname.startsWith(okPath)) &&
    !_config.ff.apiV2.enabled
  ) {
    console.log("APIV2 disabled, redirecting 404", pathname);
    return new NextResponse(null, { status: StatusCodes.NOT_FOUND });
  }

  if (pathname.startsWith("/_index-egapro/") && !_config.ff.declaV2) {
    console.log("DeclarationV2 disabled, redirecting 404", pathname);
    return new NextResponse(null, { status: StatusCodes.NOT_FOUND });
  }

  if (pathname.startsWith("/login") && !_config.ff.loginV2) {
    console.log("LoginV2 disabled, redirecting 404", pathname);
    return new NextResponse(null, { status: StatusCodes.NOT_FOUND });
  }

  return NextResponse.next();
};

// export const middleware = nextMiddleware;
export const middleware = withAuth(
  // Next Middleware
  nextMiddleware,
  // Next auth config - will run **before** middleware
  {
    ...authBaseConfig,
    callbacks: {
      authorized({ req, token }) {
        const { pathname } = req.nextUrl;
        if (!token?.email) {
          if (_config.api.security.auth.privateRoutes.some(route => pathname.startsWith(route))) {
            return false;
          }
        } else if (_config.api.security.auth.staffRoutes.some(route => pathname.startsWith(route)) && !token.staff) {
          return false;
        }

        return true;
      },
    },
  },
);

export const config = {
  matcher: ["/((?!api/admin/referent/import|apiv2/admin/referent/import|_next/static|_next/image|favicon.ico).*)"],
};
