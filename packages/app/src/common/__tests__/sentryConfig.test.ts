import { getSentrySampleRates, toSentryEnvironment } from "@common/sentryConfig";

const derive = (rawEnvironment: string | undefined) => {
  const environment = toSentryEnvironment(rawEnvironment);
  return { environment, rates: getSentrySampleRates(environment) };
};

describe("sentryConfig", () => {
  it.each([
    { raw: "prod", environment: "prod", traces: 0.1, replaysSession: 0.1 },
    { raw: "preprod", environment: "preprod", traces: 1, replaysSession: 0.5 },
    { raw: "dev", environment: "dev", traces: 1, replaysSession: 0.5 },
    { raw: undefined, environment: "dev", traces: 1, replaysSession: 0.5 },
    { raw: "production", environment: "dev", traces: 1, replaysSession: 0.5 },
  ])("maps $raw to the $environment environment", ({ raw, environment, traces, replaysSession }) => {
    expect(derive(raw)).toStrictEqual({
      environment,
      rates: { errors: 1, traces, replaysSession, replaysOnError: 1 },
    });
  });

  it("never samples errors, whatever the environment", () => {
    for (const raw of ["prod", "preprod", "dev", undefined]) {
      expect(derive(raw).rates.errors).toBe(1);
    }
  });
});
