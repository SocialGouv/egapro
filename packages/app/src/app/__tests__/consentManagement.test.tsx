import { act, render } from "@testing-library/react";

import { useConsent } from "../consentManagement";

type Consent = ReturnType<typeof useConsent>;

const securityError = () => new DOMException("The operation is insecure.", "SecurityError");

const renderConsent = () => {
  const consent: { current?: Consent } = {};
  const Probe = () => {
    consent.current = useConsent();
    return null;
  };
  render(<Probe />);
  return consent;
};

describe("Consentement avec un stockage local refusé", () => {
  afterEach(() => jest.restoreAllMocks());

  it("considère qu'aucun consentement n'est enregistré quand la lecture est refusée", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw securityError();
    });

    expect(renderConsent).not.toThrow();
  });

  it("garde le consentement pour la session quand l'écriture est refusée", async () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw securityError();
    });
    const consent = renderConsent();

    await act(async () => {
      await consent.current?.assumeConsent("matomo");
    });

    expect(consent.current?.finalityConsent?.matomo).toBe(true);
  });
});
