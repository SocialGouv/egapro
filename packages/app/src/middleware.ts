import { config as _config } from "@common/config";
import { StatusCodes } from "http-status-codes";
import { NextResponse } from "next/server";
import { type NextMiddlewareWithAuth, withAuth } from "next-auth/middleware";

const cspMiddleware: NextMiddlewareWithAuth = req => {
  //const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  // In dev environment, Next injects scripts for HMR, so we need to desactivate script-src.

  // For trusted-types, there is a problem with the [revalidatePath bug](https://github.com/vercel/next.js/issues/49387), so we need to desactivate it in dev environment for the moment. Try to reactivate it when it will be fixed in Next (it seems to be fixed in Next 14).
  // const cspHeader = `
  //   default-src 'self' https://*.gouv.fr;
  //   connect-src 'self' https://*.gouv.fr;
  //   font-src 'self' data: blob:;
  //   media-src 'self' https://*.gouv.fr;
  //   img-src 'self' data: https://*.gouv.fr;
  //   script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${
  //     process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""
  //   };
  //   frame-src 'self' https://*.gouv.fr;
  //   style-src 'self' https://*.gouv.fr 'nonce-${nonce}';
  //   frame-ancestors 'self' https://*.gouv.fr;
  //   object-src 'none';
  //   base-uri 'self' https://*.gouv.fr;
  //   form-action 'self' https://*.gouv.fr;
  //   block-all-mixed-content;
  //   upgrade-insecure-requests; `;

  // ${
  //   process.env.NODE_ENV === "development"
  //     ? ""
  //     : `require-trusted-types-for 'script';
  //        trusted-types react-dsfr react-dsfr-asap nextjs#bundler matomo-next;`
  // }

  const cspHeader = `
    default-src 'self' https://*.gouv.fr;
    connect-src 'self' https://*.gouv.fr;
    font-src 'self' data: blob:;
    media-src 'self' https://*.gouv.fr;
    img-src 'self' data: https://*.gouv.fr;
    script-src 'self' https://*.gouv.fr 'unsafe-inline' 'unsafe-eval';
    frame-src 'self' https://*.gouv.fr;
    style-src 'self' https://*.gouv.fr 'unsafe-inline';
    worker-src 'self' blob:;
    frame-ancestors 'self' https://*.gouv.fr;
    object-src 'none';
    base-uri 'self' https://*.gouv.fr;
    form-action 'self' https://*.gouv.fr;
    block-all-mixed-content;
    upgrade-insecure-requests; `;

  const responseHeaders = new Headers();
  //responseHeaders.set("x-nonce", nonce);
  responseHeaders.set(
    "Content-Security-Policy",
    // Replace newline characters and spaces
    cspHeader.replace(/\s{2,}/g, " ").trim(),
  );

  responseHeaders.set("Cross-Origin-Resource-Policy", "cross-origin");
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

const nextMiddleware: NextMiddlewareWithAuth = async (req, event) => {
  const { pathname, href } = req.nextUrl;

  // handling authorization by ourselves (and not with authorize callback)
  const { token } = req.nextauth;
  if (!token?.email) {
    if (_config.api.security.auth.privateRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(`${_config.host}/login?callbackUrl=${encodeURIComponent(href)}`);
    }
  }

  const isStaff = token?.user?.staff || token?.staff.impersonating || false;
  if (_config.api.security.auth.staffRoutes.some(route => pathname.startsWith(route)) && !isStaff) {
    return new NextResponse(null, { status: StatusCodes.FORBIDDEN });
  }

  return cspMiddleware(req, event);
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
