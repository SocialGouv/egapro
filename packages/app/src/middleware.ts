/* eslint-disable @next/next/no-server-import-in-page */
import { config } from "@common/config";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // TODO next13 new middleware custom response
  if (pathname.startsWith("/representation-equilibree/recherche") && !config.api.ff["repeq-search"]) {
    return NextResponse.redirect(new URL("/404", req.url));
  }

  if (
    pathname.startsWith("/representation-equilibree") &&
    !pathname.startsWith("/representation-equilibree/recherche") &&
    !config.api.ff["repeq"]
  ) {
    return NextResponse.redirect(new URL("/404", req.url));
  }

  if (pathname.startsWith("/apiv2/") && !config.api.ff.apiv2) {
    return NextResponse.redirect(new URL("/404", req.url));
  }

  return NextResponse.next();
}
