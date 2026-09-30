import { REGEX_URL, Url } from "../Url";

describe("Url", () => {
  it.each(["https://example.com", "http://www.travail.gouv.fr/index-egapro", "example.com/path?q=1#x"])(
    "accepts %p",
    url => {
      expect(new Url(url).getValue()).toBe(url);
    },
  );

  it.each(["not a url", "foo", "javascript:alert(1)"])("rejects %p", url => {
    expect(() => new Url(url)).toThrow();
  });

  it("answers in linear time on a long host-like input (no catastrophic backtracking)", () => {
    const start = Date.now();
    REGEX_URL.test(`a${".a".repeat(5000)} `);
    expect(Date.now() - start).toBeLessThan(500);
  });
});
