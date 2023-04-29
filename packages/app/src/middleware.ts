import { config as _config } from "@common/config";
import { StatusCodes } from "http-status-codes";
import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
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

  return NextResponse.next();
}

export const config = {
  matcher: `/((?!api/admin/referent/import|apiv2/admin/referent/import|_next/static|_next/image|favicon.ico).*)`,
};
