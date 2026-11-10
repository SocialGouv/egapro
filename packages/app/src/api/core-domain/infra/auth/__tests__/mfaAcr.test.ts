/**
 * @jest-environment node
 */
import { isMfaAcr, MFA_CLAIMS, readAcr } from "../mfaAcr";

const idTokenWith = (claims: Record<string, unknown>) =>
  ["header", Buffer.from(JSON.stringify(claims)).toString("base64url"), "signature"].join(".");

describe("isMfaAcr", () => {
  it.each(["eidas0-mfa", "eidas1-mfa", "eidas2", "eidas3"])("accepts %s (second factor proven)", acr => {
    expect(isMfaAcr(acr)).toBe(true);
  });

  it.each(["eidas0", "eidas1", "", null, undefined, 42])("refuses %p (no second factor)", acr => {
    expect(isMfaAcr(acr)).toBe(false);
  });
});

describe("MFA_CLAIMS", () => {
  it("asks the four MFA levels as essential, so ProConnect refuses rather than downgrade", () => {
    expect(JSON.parse(MFA_CLAIMS)).toEqual({
      id_token: {
        acr: { essential: true, values: ["eidas0-mfa", "eidas1-mfa", "eidas2", "eidas3"] },
      },
    });
  });
});

describe("readAcr", () => {
  it("reads the acr claim of an id_token", () => {
    expect(readAcr(idTokenWith({ acr: "eidas2", sub: "x" }))).toBe("eidas2");
  });

  it("returns null when the token carries no acr", () => {
    expect(readAcr(idTokenWith({ sub: "x" }))).toBeNull();
    expect(readAcr(idTokenWith({ acr: 3 }))).toBeNull();
  });

  it("returns null when there is no readable token", () => {
    expect(readAcr(undefined)).toBeNull();
    expect(readAcr(null)).toBeNull();
    expect(readAcr("")).toBeNull();
    expect(readAcr("not-a-jwt")).toBeNull();
    expect(readAcr("a.not-base64-json.c")).toBeNull();
  });
});
