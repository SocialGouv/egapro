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
  const isKeycloak =
    issuer.includes("localhost") || issuer.includes("keycloak");
  const endSessionUrl = new URL(
    isKeycloak
      ? `${issuer}/realms/atlas/protocol/openid-connect/logout`
      : issuer.replace(/\/api\/v2$/, "") + "/api/v2/session/end",
  );

  endSessionUrl.searchParams.set("id_token_hint", session.user.idToken);
  endSessionUrl.searchParams.set(
    "post_logout_redirect_uri",
    process.env.NEXT_PUBLIC_HOST || "http://localhost:3000",
  );

  return NextResponse.redirect(endSessionUrl);
}
