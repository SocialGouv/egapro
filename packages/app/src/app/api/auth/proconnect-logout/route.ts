import { authConfig } from "@api/core-domain/infra/auth/config";
import { config } from "@common/config";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const NEXTAUTH_COOKIES = [
  // Dev (HTTP) cookie names
  "next-auth.session-token",
  "next-auth.csrf-token",
  "next-auth.callback-url",
  // Prod (HTTPS) cookie names — __Secure- and __Host- prefixes
  "__Secure-next-auth.session-token",
  "__Secure-next-auth.callback-url",
  "__Host-next-auth.csrf-token",
  "__Secure-next-auth.csrf-token",
];

function clearSessionCookies(response: NextResponse) {
  for (const name of NEXTAUTH_COOKIES) {
    response.cookies.set(name, "", {
      maxAge: 0,
      path: "/",
      secure: name.startsWith("__"),
      httpOnly: true,
      sameSite: "lax",
    });
  }
  return response;
}

export async function GET(request: Request) {
  const session = await getServerSession(authConfig);
  const baseUrl = process.env.NEXT_PUBLIC_HOST || "http://localhost:3000";
  const { searchParams } = new URL(request.url);
  const switchOrg = searchParams.has("switchOrg");

  if (!session?.user?.idToken) {
    const fallbackUrl = new URL(switchOrg ? "/login" : "/", baseUrl);
    return clearSessionCookies(NextResponse.redirect(fallbackUrl));
  }

  const { issuer } = config.proconnect;
  const endSessionUrl = new URL(
    issuer.replace(/\/api\/v2$/, "") + "/api/v2/session/end",
  );

  endSessionUrl.searchParams.set("id_token_hint", session.user.idToken);
  endSessionUrl.searchParams.set("post_logout_redirect_uri", baseUrl);

  // OIDC RP-Initiated Logout: the state param is forwarded back to
  // post_logout_redirect_uri as a query parameter by ProConnect.
  if (switchOrg) {
    endSessionUrl.searchParams.set("state", "switchOrg");
  }

  return clearSessionCookies(NextResponse.redirect(endSessionUrl));
}
