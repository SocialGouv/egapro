/**
 * @jest-environment node
 */
import { GET } from "../route";

describe("logout callback route", () => {
  it("redirects to the home page", () => {
    const res = GET(new Request("https://app.test/api/auth/logout/callback"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://app.test/");
  });

  it("redirects to the public host (x-forwarded-host) behind the proxy", () => {
    const request = new Request("https://localhost:3000/api/auth/logout/callback", {
      headers: { "x-forwarded-host": "egapro.example.gouv.fr", "x-forwarded-proto": "https" },
    });
    const res = GET(request);
    expect(res.headers.get("location")).toBe("https://egapro.example.gouv.fr/");
  });
});
