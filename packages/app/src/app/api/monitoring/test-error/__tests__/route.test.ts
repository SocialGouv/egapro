/**
 * @jest-environment node
 */
import { GET } from "../route";

const setEnv = (env: string | undefined) => {
  if (env === undefined) delete process.env.NEXT_PUBLIC_EGAPRO_ENV;
  else process.env.NEXT_PUBLIC_EGAPRO_ENV = env;
};

describe("observability test-error route", () => {
  const originalEnv = process.env.NEXT_PUBLIC_EGAPRO_ENV;

  afterAll(() => setEnv(originalEnv));

  it.each([undefined, "prod", "preprod"])("is not exposed when the environment is %s", async env => {
    setEnv(env);

    const res = await GET();

    expect(res.status).toBe(404);
  });

  it("throws in dev so the server runtime reports it to Sentry", async () => {
    setEnv("dev");

    await expect(GET()).rejects.toThrow("Sentry server test error");
  });
});
