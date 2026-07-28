import { describe, expect, it } from "vitest";

import {
	formatVariablePayProportion,
	variablePayProportion,
} from "../shared/variablePay";

describe("variablePayProportion", () => {
	// Oracle: the GIP-MDS edge-case fixture shipped in
	// scripts/generate-edge-case-gip-data.ts, which pairs
	// Effectif_F_rem_annuelle_variable=45 / Effectif_F_rem_annuelle_globale=80
	// with Proportion_variable_F=0.5625, and 60/100 with 0.6.
	it("matches the GIP-MDS convention for women", () => {
		expect(variablePayProportion(45, 80)).toBe(0.5625);
	});

	it("matches the GIP-MDS convention for men", () => {
		expect(variablePayProportion(60, 100)).toBe(0.6);
	});

	it("does not make the two proportions sum to 1", () => {
		const women = variablePayProportion(45, 80) ?? 0;
		const men = variablePayProportion(60, 100) ?? 0;
		expect(women + men).toBeCloseTo(1.1625);
	});

	it("rounds to 4 decimals, matching the numeric(9,4) column", () => {
		expect(variablePayProportion(1, 3)).toBe(0.3333);
		expect(variablePayProportion(2, 3)).toBe(0.6667);
	});

	it("accepts numeric strings coming from the DB and from form inputs", () => {
		expect(variablePayProportion("14", 35)).toBe(0.4);
		expect(variablePayProportion("18", "35")).toBe(0.5143);
	});

	it("returns null when a count is missing", () => {
		expect(variablePayProportion(null, 35)).toBeNull();
		expect(variablePayProportion(14, null)).toBeNull();
		expect(variablePayProportion(undefined, 35)).toBeNull();
		expect(variablePayProportion("", 35)).toBeNull();
	});

	it("returns null for non-numeric input", () => {
		expect(variablePayProportion("abc", 35)).toBeNull();
		expect(variablePayProportion(Number.NaN, 35)).toBeNull();
	});

	it("returns null when the workforce is zero", () => {
		expect(variablePayProportion(0, 0)).toBeNull();
		expect(variablePayProportion(14, 0)).toBeNull();
	});

	it("returns 0 when nobody benefits from variable pay", () => {
		expect(variablePayProportion(0, 35)).toBe(0);
	});
});

describe("formatVariablePayProportion", () => {
	// The exact figures reported in issue #3940.
	it("formats the ticket's women row", () => {
		expect(formatVariablePayProportion("14", 35)).toBe("40,0 %");
	});

	it("formats the ticket's men row", () => {
		expect(formatVariablePayProportion("18", 35)).toBe("51,4 %");
	});

	it("returns the empty placeholder when the proportion is unavailable", () => {
		expect(formatVariablePayProportion("", 35)).toBe("- %");
		expect(formatVariablePayProportion("14", undefined)).toBe("- %");
		expect(formatVariablePayProportion("14", 0)).toBe("- %");
		expect(formatVariablePayProportion(Number.NaN, 35)).toBe("- %");
	});
});
