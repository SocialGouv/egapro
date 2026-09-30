/**
 * @jest-environment node
 */
import { fetchEndSessionEndpoint } from "@api/core-domain/infra/auth/proconnect-logout";
import { getToken } from "next-auth/jwt";

import { GET } from "../route";

jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));
jest.mock("@api/core-domain/infra/auth/proconnect-logout", () => ({ fetchEndSessionEndpoint: jest.fn() }));
jest.mock("@common/config", () => ({
  config: { host: "https://config-host.test", api: { security: { auth: { secret: "test-secret" } } } },
}));

const mockedGetToken = getToken as jest.Mock;
const mockedFetchEndSession = fetchEndSessionEndpoint as jest.Mock;

const call = () => GET(new Request("https://app.test/api/auth/logout") as never);

describe("logout route", () => {
  const originalNextAuthUrl = process.env.NEXTAUTH_URL;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXTAUTH_URL = "https://app.test/api/auth";
  });

  afterAll(() => {
    process.env.NEXTAUTH_URL = originalNextAuthUrl;
  });

  it("redirects to end_session with id_token_hint and clears the session cookie", async () => {
    mockedGetToken.mockResolvedValue({ id_token: "ID_TOKEN" });
    mockedFetchEndSession.mockResolvedValue("https://issuer.test/session/end");

    const res = await call();
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("https://issuer.test/session/end");
    expect(location).toContain("id_token_hint=ID_TOKEN");
    expect(location).toContain("post_logout_redirect_uri=");
    expect(res.headers.get("set-cookie")).toContain("__Secure-next-auth.session-token=;");
    expect(res.headers.get("clear-site-data")).toBe('"storage"');
  });

  it("builds post_logout_redirect_uri from NEXTAUTH_URL, never from x-forwarded-host or the internal origin", async () => {
    mockedGetToken.mockResolvedValue({ id_token: "ID_TOKEN" });
    mockedFetchEndSession.mockResolvedValue("https://issuer.test/session/end");

    // request.url is the internal origin on Kubernetes, and x-forwarded-host is
    // client-controlled: neither may pick the redirect target.
    const request = new Request("https://localhost:3000/api/auth/logout", {
      headers: { "x-forwarded-host": "evil.example.com", "x-forwarded-proto": "https" },
    });
    const res = await GET(request as never);
    const location = res.headers.get("location") ?? "";
    const redirectUri = new URL(location).searchParams.get("post_logout_redirect_uri");
    expect(redirectUri).toBe("https://app.test/login");
  });

  it("redirects home on the canonical host when x-forwarded-host is spoofed", async () => {
    mockedGetToken.mockResolvedValue(null);
    const request = new Request("https://localhost:3000/api/auth/logout", {
      headers: { "x-forwarded-host": "evil.example.com" },
    });
    const res = await GET(request as never);
    expect(res.headers.get("location")).toBe("https://app.test/");
  });

  it("falls back to the configured host when NEXTAUTH_URL is not set", async () => {
    delete process.env.NEXTAUTH_URL;
    mockedGetToken.mockResolvedValue(null);
    const res = await call();
    expect(res.headers.get("location")).toBe("https://config-host.test/");
  });

  it("falls back to home when there is no id_token", async () => {
    mockedGetToken.mockResolvedValue(null);
    const res = await call();
    expect(res.headers.get("location")).toBe("https://app.test/");
  });

  it("falls back to home when the end_session_endpoint is unavailable", async () => {
    mockedGetToken.mockResolvedValue({ id_token: "ID_TOKEN" });
    mockedFetchEndSession.mockResolvedValue(null);
    const res = await call();
    expect(res.headers.get("location")).toBe("https://app.test/");
  });
});
