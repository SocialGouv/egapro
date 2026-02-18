import { authConfig } from "@api/core-domain/infra/auth/config";
import { config } from "@common/config";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.idToken) {
    return NextResponse.redirect(
      new URL("/", process.env.NEXT_PUBLIC_HOST || "http://localhost:3000"),
    );
  }

  const { issuer } = config.proconnect;
  const endSessionUrl = new URL(
    issuer.replace(/\/api\/v2$/, "") + "/api/v2/session/end",
  );

  console.log("ID_TOKEN: ", session.user.idToken);
  endSessionUrl.searchParams.set("id_token_hint", session.user.idToken);
  endSessionUrl.searchParams.set(
    "post_logout_redirect_uri",
    process.env.NEXT_PUBLIC_HOST || "http://localhost:3000",
  );

  return NextResponse.redirect(endSessionUrl);
}
