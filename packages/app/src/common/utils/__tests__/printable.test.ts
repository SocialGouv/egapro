import { Siren } from "@common/core-domain/domain/valueObjects/Siren";
import { Email } from "@common/shared-domain/domain/valueObjects";

import { printable } from "../string";

describe("printable", () => {
  it("escapes control characters and caps the length", () => {
    expect(printable('12\n{"level":30,"msg":"forged"}\r')).toBe('12\\x0a{"level":30,"msg":"forged"}\\x0d');
    expect(printable("a".repeat(500))).toHaveLength(101);
    expect(printable("Le Siren 123")).toBe("Le Siren 123");
  });

  it("keeps rejected values from forging log lines through validation errors", () => {
    expect(() => new Siren("12\nFORGED")).toThrow(/12\\x0aFORGED/);
    expect(() => new Email("x\ny")).toThrow(/x\\x0ay/);
  });
});
