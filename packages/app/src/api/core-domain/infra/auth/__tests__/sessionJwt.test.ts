/**
 * @jest-environment node
 */
import { decode as decodeUnverified, sign } from "jsonwebtoken";

import { authConfig } from "../config";

jest.mock("@api/core-domain/repo", () => ({ ownershipRepo: {} }));
jest.mock("@api/core-domain/infra/companies-store", () => ({ companiesUtils: {} }));
jest.mock("@api/core-domain/useCases/SyncOwnership", () => ({ SyncOwnership: jest.fn() }));
jest.mock("@api/utils/pino", () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

const SECRET = "test-session-secret";
const { encode, decode } = authConfig.jwt!;
const claims = { email: "u@test.fr", user: { email: "u@test.fr", staff: false, tokenApiV1: "t" } };

const THIRTY_DAYS = 30 * 24 * 60 * 60;

describe("session JWT", () => {
  it("expires after the session max age (not only the cookie)", async () => {
    const jwt = await encode!({ token: claims as never, secret: SECRET, maxAge: authConfig.session!.maxAge });
    const { exp, iat } = decodeUnverified(jwt) as { exp: number; iat: number };
    expect(exp - iat).toBe(authConfig.session!.maxAge);
  });

  it("ignores next-auth's 30-day jwt.maxAge passed at sign-in", async () => {
    const jwt = await encode!({ token: claims as never, secret: SECRET, maxAge: THIRTY_DAYS });
    const { exp, iat } = decodeUnverified(jwt) as { exp: number; iat: number };
    expect(exp - iat).toBe(authConfig.session!.maxAge);
    expect(exp - iat).toBeLessThan(THIRTY_DAYS);
  });

  it("gives next-auth the session max age as jwt max age", () => {
    expect(authConfig.jwt!.maxAge).toBe(authConfig.session!.maxAge);
  });

  it("rejects a session token without expiry", async () => {
    const eternal = sign(claims, SECRET, { algorithm: "HS256" });
    await expect(decode!({ token: eternal, secret: SECRET })).resolves.toBeNull();
  });

  it("re-signs a refreshed session with a new expiry", async () => {
    const stale = { ...claims, iat: 1, exp: 2 };
    const jwt = await encode!({ token: stale as never, secret: SECRET, maxAge: 3600 });
    const { exp } = decodeUnverified(jwt) as { exp: number };
    expect(exp).toBeGreaterThan(Date.now() / 1000);
  });

  it("rejects an expired session token", async () => {
    const expired = sign({ ...claims, exp: Math.floor(Date.now() / 1000) - 10 }, SECRET, { algorithm: "HS256" });
    await expect(decode!({ token: expired, secret: SECRET })).resolves.toBeNull();
  });

  it("accepts a valid session token", async () => {
    const jwt = await encode!({ token: claims as never, secret: SECRET, maxAge: 3600 });
    await expect(decode!({ token: jwt, secret: SECRET })).resolves.toMatchObject({ email: "u@test.fr" });
  });
});
