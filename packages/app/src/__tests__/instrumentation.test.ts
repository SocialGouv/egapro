/**
 * @jest-environment node
 */
import { assertJwtSecretIsSet, register } from "../instrumentation";

jest.mock("@sentry/nextjs", () => ({}));

const env = (vars: Record<string, string | undefined>) => vars as unknown as NodeJS.ProcessEnv;

describe("assertJwtSecretIsSet", () => {
  it.each([undefined, "", "secret", "sikretfordevonly"])(
    "refuses to start a production server with the JWT secret %p",
    secret => {
      expect(() =>
        assertJwtSecretIsSet(
          env({ NODE_ENV: "production", NEXT_PUBLIC_EGAPRO_ENV: "prod", SECURITY_JWT_SECRET: secret }),
        ),
      ).toThrow(/SECURITY_JWT_SECRET/);
    },
  );

  it("treats a missing NEXT_PUBLIC_EGAPRO_ENV as production", () => {
    expect(() => assertJwtSecretIsSet(env({ NODE_ENV: "production" }))).toThrow();
  });

  it("accepts a real secret in production", () => {
    expect(() =>
      assertJwtSecretIsSet(
        env({ NODE_ENV: "production", NEXT_PUBLIC_EGAPRO_ENV: "preprod", SECURITY_JWT_SECRET: "a-long-random-value" }),
      ),
    ).not.toThrow();
  });

  it.each([
    { NODE_ENV: "development" },
    { NODE_ENV: "production", NEXT_PUBLIC_EGAPRO_ENV: "dev", SECURITY_JWT_SECRET: "sikretfordevonly" },
  ])("does not check dev servers (%p)", vars => {
    expect(() => assertJwtSecretIsSet(env(vars))).not.toThrow();
  });
});

describe("register", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it("stops the production server when the JWT secret is the dev one (Next 14 would only log the error)", async () => {
    const exit = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });
    jest.spyOn(console, "error").mockImplementation(() => {});
    Object.assign(process.env, {
      NEXT_RUNTIME: "nodejs",
      NODE_ENV: "production",
      NEXT_PUBLIC_EGAPRO_ENV: "prod",
      SECURITY_JWT_SECRET: "sikretfordevonly",
    });

    await expect(register()).rejects.toThrow("process.exit");
    expect(exit).toHaveBeenCalledWith(1);
  });
});
