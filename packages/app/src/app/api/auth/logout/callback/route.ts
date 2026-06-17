import { NextResponse } from "next/server";

/**
 * post_logout_redirect_uri target hit by ProConnect after the IdP session is
 * terminated. Sends the user back to the home page.
 */
export function GET(request: Request) {
  const baseUrl = new URL(request.url).origin;
  return NextResponse.redirect(new URL("/", baseUrl));
}
