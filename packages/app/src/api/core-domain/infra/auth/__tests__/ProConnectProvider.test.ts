import { ProConnectProvider } from "../ProConnectProvider";

describe("ProConnectProvider", () => {
  it("requests acr_values=eidas0 and keeps the provider id", () => {
    const provider = ProConnectProvider({ clientId: "id", clientSecret: "secret" });
    expect(provider.id).toBe("moncomptepro");
    const authorization = provider.authorization as { params: { acr_values?: string } };
    expect(authorization.params.acr_values).toBe("eidas0");
  });
});
