/**
 * @jest-environment node
 */
import { areCrashTestsEnabled, areTestRoutesEnabled } from "../testRoutes";

const setEnv = (env: string | undefined) => {
  if (env === undefined) delete process.env.NEXT_PUBLIC_EGAPRO_ENV;
  else process.env.NEXT_PUBLIC_EGAPRO_ENV = env;
};

describe("test route guards", () => {
  const originalEnv = process.env.NEXT_PUBLIC_EGAPRO_ENV;

  afterAll(() => setEnv(originalEnv));

  it.each([undefined, "prod", "preprod"])("keeps E2E helper routes off when the environment is %s", env => {
    setEnv(env);

    expect(areTestRoutesEnabled()).toBe(false);
  });

  it("enables E2E helper routes in dev", () => {
    setEnv("dev");

    expect(areTestRoutesEnabled()).toBe(true);
  });

  it.each([undefined, "prod"])("keeps the crash generator off when the environment is %s", env => {
    setEnv(env);

    expect(areCrashTestsEnabled()).toBe(false);
  });

  it.each(["dev", "preprod"])("enables the crash generator in %s", env => {
    setEnv(env);

    expect(areCrashTestsEnabled()).toBe(true);
  });
});
