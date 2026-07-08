import { type ProConnectProfile, ProConnectProvider } from "../ProConnectProvider";

type UserinfoContext = {
  client: { issuer: { metadata: { userinfo_endpoint?: string } } };
  tokens: { access_token?: string };
};
type ProviderWithUserinfo = {
  userinfo: { request: (context: UserinfoContext) => Promise<ProConnectProfile> };
};

const callUserinfoRequest = (context: UserinfoContext) => {
  const provider = ProConnectProvider({ clientId: "id", clientSecret: "secret" });
  return (provider as unknown as ProviderWithUserinfo).userinfo.request(context);
};

const client = { issuer: { metadata: { userinfo_endpoint: "https://idp.example/userinfo" } } };

const mockFetchBody = (body: string) => {
  global.fetch = jest.fn().mockResolvedValue({ text: async () => body } as unknown as Response) as typeof fetch;
};

describe("ProConnectProvider", () => {
  it("requests acr_values=eidas0 and keeps the provider id", () => {
    const provider = ProConnectProvider({ clientId: "id", clientSecret: "secret" });
    expect(provider.id).toBe("proconnect");
    const authorization = provider.authorization as { params: { acr_values?: string } };
    expect(authorization.params.acr_values).toBe("eidas0");
  });

  describe("userinfo.request", () => {
    const originalFetch = global.fetch;
    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("decodes a signed JWT userinfo response (ProConnect returns application/jwt)", async () => {
      const claims = { email: "test@fia1.fr", organizations: [], sub: "1" };
      const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
      mockFetchBody(`header.${payload}.signature`);

      await expect(callUserinfoRequest({ client, tokens: { access_token: "at" } })).resolves.toMatchObject({
        email: "test@fia1.fr",
        sub: "1",
      });
    });

    it("still parses a plain JSON userinfo response", async () => {
      mockFetchBody(JSON.stringify({ email: "json@fia1.fr", sub: "2" }));

      await expect(callUserinfoRequest({ client, tokens: { access_token: "at" } })).resolves.toMatchObject({
        email: "json@fia1.fr",
        sub: "2",
      });
    });

    it("throws when access_token is missing", async () => {
      await expect(callUserinfoRequest({ client, tokens: {} })).rejects.toThrow(/missing access_token/);
    });
  });
});
