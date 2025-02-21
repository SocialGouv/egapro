import { NOT_BELOW_0, NOT_BELOW_N_RESULT, NOT_HIGHER_THAN_N_RESULT } from "../messages";

describe("Messages", () => {
  describe("Dynamic messages", () => {
    it("should generate correct not below N message", () => {
      expect(NOT_BELOW_N_RESULT(5)).toBe("Le résultat ne peut pas être inférieur à 5");
      expect(NOT_BELOW_N_RESULT(10)).toBe("Le résultat ne peut pas être inférieur à 10");
    });

    it("should generate correct not higher than N message", () => {
      expect(NOT_HIGHER_THAN_N_RESULT(50)).toBe("Le résultat ne peut pas être supérieur à 50");
      expect(NOT_HIGHER_THAN_N_RESULT(100)).toBe("Le résultat ne peut pas être supérieur à 100");
    });
  });

  describe("Reused messages", () => {
    it("should use NOT_BELOW_N_RESULT for NOT_BELOW_0", () => {
      expect(NOT_BELOW_0).toBe("Le résultat ne peut pas être inférieur à 0");
      expect(NOT_BELOW_0).toBe(NOT_BELOW_N_RESULT(0));
    });
  });
});
