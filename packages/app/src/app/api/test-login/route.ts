import { companiesUtils } from "@api/core-domain/infra/companies-store";
import { config } from "@common/config";
import { type Algorithm, sign } from "jsonwebtoken";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Fixed ProConnect sandbox test account (the test IdP returns this SIRET).
const TEST_EMAIL = "test@fia1.fr";
const TEST_SIREN = "130025265";
const TEST_COMPANY_LABEL = "DIRECTION INTERMINISTERIELLE DU NUMERIQUE";
const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60;

/**
 * Dev-only login bypass for E2E tests. Establishes a NextAuth session for the
 * fixed ProConnect sandbox test account without going through the OIDC flow —
 * Cypress cannot carry the state/PKCE cookies across ProConnect's external
 * superdomains (the real flow stays covered by manual/Playwright testing).
 * Disabled in production (404), mirroring /api/clean-test-user/declaration.
 */
export async function POST(request: NextRequest) {
  if (config.env === "prod") {
    return NextResponse.json({ error: "Route désactivée en production" }, { status: 404 });
  }

  // Seed Redis with the single active company; the session callback rehydrates
  // `companies` from Redis using this hash (mono-entreprise: length 1).
  const companiesHash = await companiesUtils.hashCompanies([{ siren: TEST_SIREN, label: TEST_COMPANY_LABEL }]);

  const tokenApiV1 = sign({ sub: TEST_EMAIL }, config.api.security.jwtv1.secret, {
    algorithm: config.api.security.jwtv1.algorithm as Algorithm,
    expiresIn: "24h",
  });

  // Same token shape the NextAuth jwt callback produces for a ProConnect login.
  const token = {
    email: TEST_EMAIL,
    staff: {
      impersonating: false,
      lastImpersonatedHash: "",
    },
    sub: TEST_EMAIL,
    user: {
      companiesHash,
      email: TEST_EMAIL,
      firstname: "John",
      lastname: "Doe",
      phoneNumber: "0123456789",
      staff: false,
      tokenApiV1,
    },
  };

  const sessionToken = sign(token, config.api.security.auth.secret, {
    algorithm: "HS256",
    expiresIn: SESSION_MAX_AGE_SECONDS,
  });

  // The deployed app is served over HTTPS behind the proxy, so NextAuth uses the
  // `__Secure-` cookie prefix; match it from the forwarded protocol.
  const isSecure = (
    request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "")
  ).includes("https");
  const cookieName = isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token";

  const response = NextResponse.json({ email: TEST_EMAIL, siren: TEST_SIREN, success: true });
  response.cookies.set(cookieName, sessionToken, {
    expires: undefined,
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: isSecure,
  });
  return response;
}
