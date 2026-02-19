import { authConfig } from "@api/core-domain/infra/auth/config";
import { config } from "@common/config";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

const NEXTAUTH_COOKIES = [
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
  "next-auth.csrf-token",
  "__Secure-next-auth.csrf-token",
  "next-auth.callback-url",
  "__Secure-next-auth.callback-url",
];

function clearSessionCookies(response: NextResponse) {
  for (const name of NEXTAUTH_COOKIES) {
    response.cookies.set(name, "", { maxAge: 0, path: "/" });
  }
  return response;
}

export async function GET() {
  const session = await getServerSession(authConfig);
  const baseUrl = process.env.NEXT_PUBLIC_HOST || "http://localhost:3000";

  if (!session?.user?.idToken) {
    return clearSessionCookies(NextResponse.redirect(new URL("/", baseUrl)));
  }

  const { issuer } = config.proconnect;
  const endSessionUrl = new URL(
    issuer.replace(/\/api\/v2$/, "") + "/api/v2/session/end",
  );

  endSessionUrl.searchParams.set("id_token_hint", session.user.idToken);
  endSessionUrl.searchParams.set("post_logout_redirect_uri", baseUrl);

  return clearSessionCookies(NextResponse.redirect(endSessionUrl));
}
