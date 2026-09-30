/**
 * @jest-environment node
 */
import { assertJwtSecretIsSet } from "../instrumentation";

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
