/**
 * @jest-environment node
 */
import { fetchEndSessionEndpoint } from "@api/core-domain/infra/auth/proconnect-logout";
import { getToken } from "next-auth/jwt";

import { GET } from "../route";

jest.mock("next-auth/jwt", () => ({ getToken: jest.fn() }));
jest.mock("@api/core-domain/infra/auth/proconnect-logout", () => ({ fetchEndSessionEndpoint: jest.fn() }));
jest.mock("@common/config", () => ({ config: { api: { security: { auth: { secret: "test-secret" } } } } }));

const mockedGetToken = getToken as jest.Mock;
const mockedFetchEndSession = fetchEndSessionEndpoint as jest.Mock;

const call = () => GET(new Request("https://app.test/api/auth/logout") as never);

describe("logout route", () => {
  beforeEach(() => jest.clearAllMocks());

  it("redirects to end_session with id_token_hint and clears the session cookie", async () => {
    mockedGetToken.mockResolvedValue({ id_token: "ID_TOKEN" });
    mockedFetchEndSession.mockResolvedValue("https://issuer.test/session/end");

    const res = await call();
    const location = res.headers.get("location") ?? "";
    expect(location).toContain("https://issuer.test/session/end");
    expect(location).toContain("id_token_hint=ID_TOKEN");
    expect(location).toContain("post_logout_redirect_uri=");
    expect(res.headers.get("set-cookie")).toContain("__Secure-next-auth.session-token=;");
  });

  it("builds post_logout_redirect_uri from the public host (x-forwarded-host) behind the proxy", async () => {
    mockedGetToken.mockResolvedValue({ id_token: "ID_TOKEN" });
    mockedFetchEndSession.mockResolvedValue("https://issuer.test/session/end");

    // request.url is the internal origin on Kubernetes; the public host arrives
    // via x-forwarded-host / x-forwarded-proto.
    const request = new Request("https://localhost:3000/api/auth/logout", {
      headers: { "x-forwarded-host": "egapro.example.gouv.fr", "x-forwarded-proto": "https" },
    });
    const res = await GET(request as never);
    const location = res.headers.get("location") ?? "";
    const redirectUri = new URL(location).searchParams.get("post_logout_redirect_uri");
    expect(redirectUri).toBe("https://egapro.example.gouv.fr/api/auth/logout/callback");
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
