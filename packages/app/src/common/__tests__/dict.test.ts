import { getNafDescription, NAF } from "../dict";

describe("getNafDescription", () => {
  it("returns the description for a known NAF code", () => {
    expect(getNafDescription("62.01Z")).toBe(NAF["62.01Z"].description);
  });

  it.each(["99.99Z", "03.11Y", "constructor", "__proto__", ""])("returns the fallback for %s", code => {
    expect(getNafDescription(code)).toBe("inconnu");
  });
});
