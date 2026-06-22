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
});