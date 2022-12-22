/* eslint-disable @next/next/no-server-import-in-page */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  if (process.env.EGAPRO_ENV === "prod") {
    // TODO next13 new middleware custom response
    return NextResponse.redirect(new URL("/404", req.url));
  }
  return NextResponse.next();
}

export const config = {
  // TODO remove when ff is ok
  matcher: ["/representation-equilibree/recherche", "/apiv2/:path*"],
};
