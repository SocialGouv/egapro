import { describe, expect, it } from "vitest";

import {
	DECLARATION_STEPS,
	getStepLabel,
	POST_SUBMIT_MILESTONES,
} from "../shared/declarationSteps";

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

describe("POST_SUBMIT_MILESTONES", () => {
	it("exposes the 6 post-submission jalons in chronological order", () => {
		expect(POST_SUBMIT_MILESTONES.map((m) => m.key)).toEqual([
			"submit_to_path_choice",
			"path_choice_to_second_declaration",
			"path_choice_to_joint_evaluation",
			"revision_choice_to_action",
			"action_to_cse_opinion",
			"last_action_to_complete",
		]);
	});

	it("uses French labels with no empty strings", () => {
		for (const entry of POST_SUBMIT_MILESTONES) {
			expect(entry.label.length).toBeGreaterThan(0);
		}
	});

	it("uses unique keys", () => {
		const keys = POST_SUBMIT_MILESTONES.map((m) => m.key);
		expect(new Set(keys).size).toBe(keys.length);
	});
});
