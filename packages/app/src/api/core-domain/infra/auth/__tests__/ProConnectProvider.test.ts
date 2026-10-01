/**
 * @jest-environment node
 */
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";

import { type ProConnectProfile, ProConnectProvider, verifyUserinfoJwt } from "../ProConnectProvider";

jest.mock("@api/utils/pino", () => ({ logger: { info: jest.fn(), error: jest.fn() } }));

const ISSUER = "https://idp.example/api/v2";
const CLIENT_ID = "id";
const USERINFO_ENDPOINT = "https://idp.example/userinfo";
const JWKS_URI = "https://idp.example/jwks";

type UserinfoContext = {
  client: {
    issuer: { metadata: { issuer?: string; jwks_uri?: string; userinfo_endpoint?: string } };
    metadata: { client_id: string };
  };
  tokens: { access_token?: string };
};
type ProviderWithUserinfo = {
  userinfo: { request: (context: UserinfoContext) => Promise<ProConnectProfile> };
};

const callUserinfoRequest = (context: UserinfoContext) => {
  const provider = ProConnectProvider({ clientId: CLIENT_ID, clientSecret: "secret" });
  return (provider as unknown as ProviderWithUserinfo).userinfo.request(context);
};

const client = {
  issuer: { metadata: { issuer: ISSUER, jwks_uri: JWKS_URI, userinfo_endpoint: USERINFO_ENDPOINT } },
  metadata: { client_id: CLIENT_ID },
};

const generateSigner = async () => {
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256" };
  const sign = (claims: Record<string, unknown>, key: CryptoKey = privateKey) =>
    new SignJWT(claims).setProtectedHeader({ alg: "RS256", kid: "k1" }).setIssuer(ISSUER).sign(key);
  return { jwk, sign };
};

/** The IdP: serves the userinfo body and its JWKS. */
const mockIdp = (userinfoBody: string, jwks: object = { keys: [] }, userinfoStatus = 200) => {
  global.fetch = jest.fn(async (input: RequestInfo | URL) =>
    String(input) === JWKS_URI
      ? new Response(JSON.stringify(jwks), { status: 200, headers: { "content-type": "application/json" } })
      : new Response(userinfoBody, { status: userinfoStatus }),
  ) as typeof fetch;
};

describe("ProConnectProvider", () => {
  it("requests acr_values=eidas0 and keeps the provider id", () => {
    const provider = ProConnectProvider({ clientId: "id", clientSecret: "secret" });
    expect(provider.id).toBe("proconnect");
    const authorization = provider.authorization as { params: { acr_values?: string } };
    expect(authorization.params.acr_values).toBe("eidas0");
  });

  it("does not allow linking accounts by email", () => {
    const provider = ProConnectProvider({ clientId: "id", clientSecret: "secret" });
    expect(provider.allowDangerousEmailAccountLinking).toBeFalsy();
  });

  describe("userinfo.request", () => {
    const originalFetch = global.fetch;
    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("verifies and decodes a signed JWT userinfo response (ProConnect returns application/jwt)", async () => {
      const { jwk, sign } = await generateSigner();
      mockIdp(await sign({ email: "test@fia1.fr", organizations: [], sub: "1", aud: CLIENT_ID }), { keys: [jwk] });

      await expect(callUserinfoRequest({ client, tokens: { access_token: "at" } })).resolves.toMatchObject({
        email: "test@fia1.fr",
        sub: "1",
      });
    });

    it("rejects a JWT userinfo response whose signature is not verified by the issuer keys", async () => {
      const { jwk } = await generateSigner();
      const payload = Buffer.from(JSON.stringify({ email: "test@fia1.fr", sub: "1", iss: ISSUER })).toString(
        "base64url",
      );
      mockIdp(`eyJhbGciOiJSUzI1NiIsImtpZCI6ImsxIn0.${payload}.signature`, { keys: [jwk] });

      await expect(callUserinfoRequest({ client, tokens: { access_token: "at" } })).rejects.toThrow();
    });

    it("still parses a plain JSON userinfo response", async () => {
      mockIdp(JSON.stringify({ email: "json@fia1.fr", sub: "2" }));

      await expect(callUserinfoRequest({ client, tokens: { access_token: "at" } })).resolves.toMatchObject({
        email: "json@fia1.fr",
        sub: "2",
      });
    });

    it("rejects an error response instead of taking its JSON body for a profile", async () => {
      mockIdp(JSON.stringify({ error: "invalid_token" }), { keys: [] }, 401);

      await expect(callUserinfoRequest({ client, tokens: { access_token: "at" } })).rejects.toThrow(/401/);
    });

    it("throws when access_token is missing", async () => {
      await expect(callUserinfoRequest({ client, tokens: {} })).rejects.toThrow(/missing access_token/);
    });
  });
});

describe("verifyUserinfoJwt", () => {
  const options = { issuer: ISSUER, jwksUri: JWKS_URI, clientId: CLIENT_ID };

  it("returns the claims of a userinfo JWT signed by the issuer", async () => {
    const { jwk, sign } = await generateSigner();
    const jwt = await sign({ sub: "u1", email: "a@b.fr", siret: "13002526500013", aud: CLIENT_ID });

    await expect(verifyUserinfoJwt(jwt, options, createLocalJWKSet({ keys: [jwk] }))).resolves.toMatchObject({
      email: "a@b.fr",
      siret: "13002526500013",
    });
  });

  it("rejects a forged JWT (signed with another key)", async () => {
    const { jwk } = await generateSigner();
    const { sign: signWithAttackerKey } = await generateSigner();
    const jwt = await signWithAttackerKey({ sub: "u1", email: "a@b.fr", siret: "00000000000000" });

    await expect(verifyUserinfoJwt(jwt, options, createLocalJWKSet({ keys: [jwk] }))).rejects.toThrow();
  });

  it("rejects an unsigned JWT (alg none)", async () => {
    const { jwk } = await generateSigner();
    const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const jwt = `${b64({ alg: "none" })}.${b64({ iss: ISSUER, sub: "u1", email: "a@b.fr" })}.`;

    await expect(verifyUserinfoJwt(jwt, options, createLocalJWKSet({ keys: [jwk] }))).rejects.toThrow();
  });

  it("rejects a JWT from another issuer or for another audience", async () => {
    const { jwk, sign } = await generateSigner();
    const jwks = createLocalJWKSet({ keys: [jwk] });

    await expect(
      verifyUserinfoJwt(await sign({ sub: "u1" }), { ...options, issuer: "https://other.test" }, jwks),
    ).rejects.toThrow();
    await expect(verifyUserinfoJwt(await sign({ sub: "u1", aud: "other-client" }), options, jwks)).rejects.toThrow(
      /audience/,
    );
  });
});
