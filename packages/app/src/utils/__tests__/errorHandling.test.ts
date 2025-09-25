import { sanitizeClipboardText } from "../errorHandling";

describe("sanitizeClipboardText", () => {
  it("should replace non-breaking spaces with regular spaces", () => {
    const input = "Hello\u00A0World";
    const expected = "Hello World";
    expect(sanitizeClipboardText(input)).toBe(expected);
  });

  it("should preserve international characters and emojis", () => {
    const input = "Héllo Wörld 中文 😊";
    const expected = "Héllo Wörld 中文 😊";
    expect(sanitizeClipboardText(input)).toBe(expected);
  });

  it("should remove control characters", () => {
    const input = "Hello\u001FWorld";
    const expected = "HelloWorld";
    expect(sanitizeClipboardText(input)).toBe(expected);
  });

  it("should remove zero-width no-break space and problematic Unicode characters", () => {
    const input = "Hello\uFEFFWorld\u200B\u202A";
    const expected = "HelloWorld";
    expect(sanitizeClipboardText(input)).toBe(expected);
  });

  it("should normalize multiple spaces to a single space", () => {
    const input = "Hello   World";
    const expected = "Hello World";
    expect(sanitizeClipboardText(input)).toBe(expected);
  });

  it("should handle empty strings", () => {
    const input = "";
    const expected = "";
    expect(sanitizeClipboardText(input)).toBe(expected);
  });

  it("should normalize Unicode characters", () => {
    const input = "e\u0301"; // é décomposé (e + combining acute accent)
    const expected = "é"; // é composé
    expect(sanitizeClipboardText(input)).toBe(expected);
  });
});
