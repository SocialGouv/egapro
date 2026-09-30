/**
 * @jest-environment node
 */
import { companiesUtils } from "@api/core-domain/infra/companies-store";
import { verify } from "jsonwebtoken";

import { POST } from "../route";

jest.mock("@api/core-domain/infra/companies-store", () => ({
  companiesUtils: { hashCompanies: jest.fn() },
}));
jest.mock("@common/config", () => ({
  config: {
    api: {
      security: {
        auth: { secret: "test-auth-secret" },
        jwtv1: { algorithm: "HS256", secret: "test-jwtv1-secret" },
      },
    },
  },
}));

const mockedHashCompanies = companiesUtils.hashCompanies as jest.Mock;

// The route reads the raw env var, not `config.env` (which defaults to "dev").
const setEnv = (env: string | undefined) => {
  if (env === undefined) delete process.env.NEXT_PUBLIC_EGAPRO_ENV;
  else process.env.NEXT_PUBLIC_EGAPRO_ENV = env;
};

const post = (headers: Record<string, string> = {}, url = "https://app.test/api/test-login") =>
  POST(new Request(url, { headers, method: "POST" }) as never);

describe("test-login route", () => {
  const originalEnv = process.env.NEXT_PUBLIC_EGAPRO_ENV;

  afterAll(() => setEnv(originalEnv));

  beforeEach(() => {
    jest.clearAllMocks();
    setEnv("dev");
    mockedHashCompanies.mockResolvedValue("companies-hash");
  });

  it("establishes a session for the fixed ProConnect test account and sets the secure cookie behind the proxy", async () => {
    const res = await post({ "x-forwarded-proto": "https" });

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      email: "test@fia1.fr",
      siren: "130025265",
      success: true,
    });

    // The session is hydrated from Redis via the single active company hash.
    expect(mockedHashCompanies).toHaveBeenCalledWith([
      { label: "DIRECTION INTERMINISTERIELLE DU NUMERIQUE", siren: "130025265" },
    ]);

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("__Secure-next-auth.session-token=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Secure");

    const sessionToken = setCookie.match(/__Secure-next-auth\.session-token=([^;]+)/)?.[1] ?? "";
    const decoded = verify(decodeURIComponent(sessionToken), "test-auth-secret") as Record<string, unknown>;
    expect(decoded.email).toBe("test@fia1.fr");
    expect(decoded.user).toMatchObject({
      companiesHash: "companies-hash",
      email: "test@fia1.fr",
      firstname: "John",
      lastname: "Doe",
      staff: false,
    });
  });

  it("uses the non-secure cookie name when the request is not served over https", async () => {
    const res = await post({}, "http://localhost:3000/api/test-login");

    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain("next-auth.session-token=");
    expect(setCookie).not.toContain("__Secure-");
    expect(setCookie).not.toContain("Secure");
  });

  it.each(["prod", undefined, ""])(
    "is disabled outside dev/preprod (env=%p): 404 and never establishes a session",
    async env => {
      setEnv(env);

      const res = await post({ "x-forwarded-proto": "https" });

      expect(res.status).toBe(404);
      await expect(res.json()).resolves.toEqual({ error: "Route désactivée" });
      expect(res.headers.get("set-cookie")).toBeNull();
      expect(mockedHashCompanies).not.toHaveBeenCalled();
    },
  );

  it("is enabled on preprod", async () => {
    setEnv("preprod");

    const res = await post({ "x-forwarded-proto": "https" });

    expect(res.status).toBe(200);
  });
});
