describe("fetchEndSessionEndpoint", () => {
  const ORIGINAL = process.env.EGAPRO_PROCONNECT_DISCOVERY_URL;

  afterEach(() => {
    process.env.EGAPRO_PROCONNECT_DISCOVERY_URL = ORIGINAL;
    jest.resetModules();
    jest.restoreAllMocks();
  });

  const load = () => {
    jest.resetModules();
    return require("../proconnect-logout").fetchEndSessionEndpoint as () => Promise<string | null>;
  };

  it("returns the end_session_endpoint from the discovery document", async () => {
    process.env.EGAPRO_PROCONNECT_DISCOVERY_URL = "https://issuer.test";
    global.fetch = jest
      .fn()
      .mockResolvedValue({ json: async () => ({ end_session_endpoint: "https://issuer.test/logout" }) }) as never;
    await expect(load()()).resolves.toBe("https://issuer.test/logout");
    expect(global.fetch).toHaveBeenCalledWith("https://issuer.test/.well-known/openid-configuration");
  });

  it("returns null when the discovery URL is unset", async () => {
    delete process.env.EGAPRO_PROCONNECT_DISCOVERY_URL;
    await expect(load()()).resolves.toBeNull();
  });

  it("returns null when end_session_endpoint is absent", async () => {
    process.env.EGAPRO_PROCONNECT_DISCOVERY_URL = "https://issuer.test";
    global.fetch = jest.fn().mockResolvedValue({ json: async () => ({}) }) as never;
    await expect(load()()).resolves.toBeNull();
  });

  it("returns null on fetch error", async () => {
    process.env.EGAPRO_PROCONNECT_DISCOVERY_URL = "https://issuer.test";
    global.fetch = jest.fn().mockRejectedValue(new Error("network")) as never;
    await expect(load()()).resolves.toBeNull();
  });
});
