/**
 * @jest-environment node
 */
import { OPTIONS, POST } from "../route";

jest.mock("@common/config", () => ({ config: { host: "https://app.test" } }));

const DSN = "https://publickey@sentry.test/42";
const envelope = (dsn: string) =>
  [
    JSON.stringify({ dsn, event_id: "abc" }),
    JSON.stringify({ type: "event" }),
    JSON.stringify({ message: "boom" }),
  ].join("\n");

const post = (body: string, headers: Record<string, string> = {}) =>
  POST(new Request("https://app.test/api/monitoring/envelope", { method: "POST", body, headers }) as never);

describe("sentry tunnel route", () => {
  const originalEnv = { ...process.env };
  const fetchMock = jest.fn();

  beforeEach(() => {
    process.env.SENTRY_URL = "https://sentry.test";
    process.env.NEXT_PUBLIC_SENTRY_DSN = DSN;
    process.env.NEXTAUTH_URL = "https://app.test/api/auth";
    fetchMock.mockReset().mockResolvedValue(new Response("{}", { status: 200 }));
    global.fetch = fetchMock;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("relays an envelope for the configured project with the configured key", async () => {
    const res = await post(envelope(DSN), { "X-Sentry-Auth": "Sentry sentry_key=attacker" });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://sentry.test/api/42/envelope/");
    expect(init.headers["X-Sentry-Auth"]).toContain("sentry_key=publickey");
  });

  it.each([
    ["another project", "https://publickey@sentry.test/666"],
    ["another key", "https://otherkey@sentry.test/42"],
  ])("refuses an envelope for %s (no open relay)", async (_, dsn) => {
    const res = await post(envelope(dsn));

    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses to relay when no DSN is configured", async () => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;

    const res = await post(envelope(DSN));

    expect(res.status).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("never reflects a foreign origin nor allows credentials", async () => {
    const res = await post(envelope(DSN), { origin: "https://evil.test" });

    expect(res.headers.get("access-control-allow-origin")).toBeNull();
    expect(res.headers.get("access-control-allow-credentials")).toBeNull();

    const preflight = await OPTIONS(
      new Request("https://app.test/api/monitoring/envelope", { headers: { origin: "https://evil.test" } }) as never,
    );
    expect(preflight.headers.get("access-control-allow-origin")).toBeNull();
    expect(preflight.headers.get("access-control-allow-credentials")).toBeNull();
  });

  it("allows the canonical origin", async () => {
    const res = await post(envelope(DSN), { origin: "https://app.test" });

    expect(res.headers.get("access-control-allow-origin")).toBe("https://app.test");
  });
});
