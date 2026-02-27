import { describe, expect, it } from "vitest";

import { getDeclarationStepLabel } from "../DeclarationStepLabel";

describe("getDeclarationStepLabel", () => {
	it("returns '-' for step 0 (not started)", () => {
		expect(getDeclarationStepLabel(0)).toBe("-");
	});

	it("returns 'Effectifs par catégorie' for step 1", () => {
		expect(getDeclarationStepLabel(1)).toBe("Effectifs par catégorie");
	});

	it("returns 'Rémunération de base' for step 2", () => {
		expect(getDeclarationStepLabel(2)).toBe("Rémunération de base");
	});

	it("returns 'Écart de rémunération' for step 3", () => {
		expect(getDeclarationStepLabel(3)).toBe("Écart de rémunération");
	});

	it("returns 'Répartition par quartile' for step 4", () => {
		expect(getDeclarationStepLabel(4)).toBe("Répartition par quartile");
	});

	it("returns 'Catégories personnalisées' for step 5", () => {
		expect(getDeclarationStepLabel(5)).toBe("Catégories personnalisées");
	});

	it("returns 'Complétée' for step 6", () => {
		expect(getDeclarationStepLabel(6)).toBe("Complétée");
	});

	it("returns '-' for an unknown step", () => {
		expect(getDeclarationStepLabel(99)).toBe("-");
	});
});
