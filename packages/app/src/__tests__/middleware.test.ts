/**
 * @jest-environment node
 */
import { captureError } from "@common/error";
import { NextRequest } from "next/server";

import middleware from "../middleware";

// Run our middleware directly, without NextAuth decoding the cookie first.
jest.mock("next-auth/middleware", () => ({ withAuth: (fn: unknown) => fn }));
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

  it("forbids the back office to an anonymous user", async () => {
    const res = await call("/admin/declarations", null);
    expect(res.status).toBe(403);
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

  it("never sends cookies or authorization headers to Sentry", async () => {
    const req = new NextRequest("https://app.test/", {
      headers: { cookie: "next-auth.session-token=SECRET", authorization: "Bearer SECRET", "user-agent": "jest" },
    });
    // No `nextauth` on the request: the middleware throws and reports the error.
    const res = await (middleware as unknown as (req: NextRequest, event: unknown) => Promise<Response>)(req, {});

    expect(res.status).toBe(500);
    const [, context] = (captureError as jest.Mock).mock.calls[0];
    expect(JSON.stringify(context)).not.toContain("SECRET");
    expect(context.headers["user-agent"]).toBe("jest");
  });
});
