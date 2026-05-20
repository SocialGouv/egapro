import { describe, expect, it } from "vitest";

import { DECLARATION_STEPS, getStepLabel } from "../shared/declarationSteps";

describe("DECLARATION_STEPS", () => {
	it("covers all 7 steps (0..6)", () => {
		expect(DECLARATION_STEPS).toHaveLength(7);
		expect(DECLARATION_STEPS.map((entry) => entry.step)).toEqual([
			0, 1, 2, 3, 4, 5, 6,
		]);
	});

	it("uses French labels with no empty strings", () => {
		for (const entry of DECLARATION_STEPS) {
			expect(entry.label.length).toBeGreaterThan(0);
		}
	});
});

describe("getStepLabel", () => {
	it("returns the French label for a known step number", () => {
		expect(getStepLabel(0)).toBe("Introduction");
		expect(getStepLabel(1)).toBe("Effectifs");
		expect(getStepLabel(2)).toBe("Écart de rémunération");
		expect(getStepLabel(3)).toBe("Écart de rémunération variable");
		expect(getStepLabel(4)).toBe("Quartiles de rémunération");
		expect(getStepLabel(5)).toBe("Écart par catégorie de salariés");
		expect(getStepLabel(6)).toBe("Récapitulatif");
	});

	it("returns a sensible fallback for unknown step numbers", () => {
		expect(getStepLabel(42)).toBe("Étape 42");
		expect(getStepLabel(-1)).toBe("Étape -1");
	});
});
