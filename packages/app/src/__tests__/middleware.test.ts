/**
 * @jest-environment node
 */
import { captureError } from "@common/error";
import { sign } from "jsonwebtoken";
import { NextRequest } from "next/server";

import middleware, { buildCspHeader } from "../middleware";

// Run our middleware directly, without NextAuth decoding the cookie first. The NextAuth options are kept on
// the returned function so the session decoding can be tested on its own.
jest.mock("next-auth/middleware", () => ({
  withAuth: (fn: object, options: unknown) => Object.assign(fn, { authOptions: options }),
}));
jest.mock("@api/utils/pino", () => ({ logger: { error: jest.fn() } }));
jest.mock("@common/error", () => ({ captureError: jest.fn() }));

type Token = Record<string, unknown> | null;

const call = (path: string, token: Token, headers: Record<string, string> = {}) => {
  const req = new NextRequest(`https://app.test${path}`, { headers });
  (req as unknown as { nextauth: { token: Token } }).nextauth = { token };
  return (middleware as unknown as (req: NextRequest, event: unknown) => Promise<Response>)(req, {});
};

const user = (staff: boolean) => ({ email: "u@test.fr", user: { staff } });

describe("middleware", () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([
    "/admin/declarations",
    "/admin/rattachements",
    "/admin/debug",
    "/admin/liste-referents",
    "/admin/impersonate",
  ])("forbids %s to a logged-in non-staff user", async path => {
    const res = await call(path, user(false));
    expect(res.status).toBe(403);
  });

  it("sends an anonymous user (or an expired staff session) from the back office to login", async () => {
    const res = await call("/admin/declarations", null);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?callbackUrl=");
  });

  it("does not crash when the token has no staff claim (403, not 500)", async () => {
    const res = await call("/admin/rattachements", { email: "u@test.fr", user: {} });
    expect(res.status).toBe(403);
    expect(captureError).not.toHaveBeenCalled();
  });

  it("lets staff in", async () => {
    const res = await call("/admin/declarations", user(true));
    expect(res.status).toBe(200);
  });

  it("lets an impersonating staff member in", async () => {
    const res = await call("/admin/declarations", { ...user(false), staff: { impersonating: true } });
    expect(res.status).toBe(200);
  });

  it("redirects an anonymous user from a private route to login", async () => {
    const res = await call("/mon-espace/mes-entreprises", null);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?callbackUrl=");
  });

  it("does not allow unsafe-eval in the CSP outside development", async () => {
    const res = await call("/", null);
    expect(res.headers.get("content-security-policy")).not.toContain("unsafe-eval");
  });

  // NextResponse.next() forwards the rewritten request headers to the renderer as `x-middleware-request-*`.
  const forwardedNonce = (res: Response) => res.headers.get("x-middleware-request-x-nonce") ?? "";

  it("tags scripts with a per-request nonce instead of allowing inline scripts", async () => {
    const first = await call("/", null);
    const second = await call("/", null);

    const csp = first.headers.get("content-security-policy") ?? "";
    const nonce = forwardedNonce(first);
    expect(nonce).not.toBe("");
    expect(csp).toMatch(new RegExp(`script-src [^;]*'nonce-${nonce}'`));
    expect(csp).not.toMatch(/script-src [^;]*'unsafe-inline'/);
    expect(forwardedNonce(second)).not.toBe(nonce);
  });

  it("only sends the nonce to the renderer, not to the browser", async () => {
    const res = await call("/", null);
    expect(forwardedNonce(res)).not.toBe("");
    expect(res.headers.get("x-nonce")).toBeNull();
  });

  it("trusts scripts by nonce only, never by host, and pins the base URI", async () => {
    const csp = buildCspHeader("abc", false);
    expect(csp).toMatch(/script-src [^;]*'strict-dynamic'/);
    expect(csp).not.toMatch(/script-src [^;]*gouv\.fr/);
    expect(csp).toContain("base-uri 'self';");
  });

  it("replaces a client-supplied CSP header and nonce before the request reaches the renderer", async () => {
    const forged = "'nonce-abc'\"><script>alert(1)</script>";
    const res = await call("/", null, {
      "content-security-policy": forged,
      "content-security-policy-report-only": forged,
      "x-nonce": forged,
    });

    const forwarded = res.headers.get("x-middleware-request-content-security-policy") ?? "";
    expect(forwarded).not.toContain("<script>");
    expect(forwarded).toContain(`'nonce-${forwardedNonce(res)}'`);
    expect(forwardedNonce(res)).not.toBe(forged);
    // Next falls back to the report-only header to find the nonce: it must not reach the renderer either.
    expect(res.headers.get("x-middleware-request-content-security-policy-report-only")).toBeNull();
    expect(res.headers.get("x-middleware-override-headers")?.split(",")).not.toContain(
      "content-security-policy-report-only",
    );
  });

  it("only allows eval in development", () => {
    expect(buildCspHeader("abc", true)).toMatch(/script-src [^;]*'unsafe-eval'/);
    expect(buildCspHeader("abc", false)).not.toContain("unsafe-eval");
  });

  it("never sends credentials or client IPs to Sentry", async () => {
    const req = new NextRequest("https://app.test/", {
      headers: {
        cookie: "next-auth.session-token=SECRET",
        authorization: "Bearer SECRET",
        "x-forwarded-for": "SECRET",
        "x-real-ip": "SECRET",
        "user-agent": "jest",
      },
    });
    // No `nextauth` on the request: the middleware throws and reports the error.
    const res = await (middleware as unknown as (req: NextRequest, event: unknown) => Promise<Response>)(req, {});

    expect(res.status).toBe(500);
    const [, context] = (captureError as jest.Mock).mock.calls[0];
    expect(JSON.stringify(context)).not.toContain("SECRET");
    expect(context.headers["user-agent"]).toBe("jest");
  });

  describe("session token decoding", () => {
    const SECRET = "test-session-secret";
    const decode = (token: string) =>
      (
        middleware as unknown as {
          authOptions: { jwt: { decode: (params: { secret: string; token: string }) => Promise<unknown> } };
        }
      ).authOptions.jwt.decode({ token, secret: SECRET });
    const now = Math.floor(Date.now() / 1000);

    it("accepts a valid session token", async () => {
      const token = sign({ email: "u@test.fr", exp: now + 60 }, SECRET, { algorithm: "HS256" });
      await expect(decode(token)).resolves.toMatchObject({ email: "u@test.fr" });
    });

    it("rejects an expired session token", async () => {
      const token = sign({ email: "u@test.fr", exp: now - 60 }, SECRET, { algorithm: "HS256" });
      await expect(decode(token)).resolves.toBeNull();
    });

    it("rejects a session token without expiry", async () => {
      const token = sign({ email: "u@test.fr" }, SECRET, { algorithm: "HS256" });
      await expect(decode(token)).resolves.toBeNull();
    });
  });
});
