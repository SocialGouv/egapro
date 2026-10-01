import { REGEX_URL, Url, URL_MAX_LENGTH } from "../Url";

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

  it("refuses an url longer than the maximum before running the regex", () => {
    const start = Date.now();
    expect(() => new Url(`a${".a".repeat(50_000)} `)).toThrow(`${URL_MAX_LENGTH} characters`);
    expect(Date.now() - start).toBeLessThan(50);
  });

  it("still accepts an url of the maximum length", () => {
    const url = `https://example.com/${"a".repeat(URL_MAX_LENGTH - "https://example.com/".length)}`;
    expect(new Url(url).getValue()).toBe(url);
  });
});
