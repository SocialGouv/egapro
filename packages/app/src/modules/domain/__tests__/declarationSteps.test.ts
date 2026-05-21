import { describe, expect, it } from "vitest";

import {
	DECLARATION_STEPS,
	DROPOFF_RATE_ALERT_THRESHOLD,
	DROPOFF_STAGNATION_DAYS_DEFAULT,
	DROPOFF_STAGNATION_DAYS_MAX,
	DROPOFF_STAGNATION_DAYS_MIN,
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
	it("exposes the 4 post-submission jalons in chronological order", () => {
		expect(POST_SUBMIT_MILESTONES.map((m) => m.key)).toEqual([
			"submit_to_path_choice",
			"path_choice_to_second_declaration",
			"path_choice_to_joint_evaluation",
			"action_to_cse_opinion",
		]);
	});

	it("uses the « Temps passé sur » labels for post-path-choice durations", () => {
		const labelByKey = new Map(
			POST_SUBMIT_MILESTONES.map((m) => [m.key, m.label]),
		);
		expect(labelByKey.get("submit_to_path_choice")).toBe(
			"Délai avant choix du parcours",
		);
		expect(labelByKey.get("path_choice_to_second_declaration")).toBe(
			"Temps passé sur la seconde déclaration",
		);
		expect(labelByKey.get("path_choice_to_joint_evaluation")).toBe(
			"Temps passé sur l'évaluation conjointe",
		);
		expect(labelByKey.get("action_to_cse_opinion")).toBe(
			"Temps passé sur l'avis CSE",
		);
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

describe("K5 dropoff constants", () => {
	it("uses 15 % as the alert threshold for the dropoff chart", () => {
		expect(DROPOFF_RATE_ALERT_THRESHOLD).toBe(15);
	});

	it("defaults the stagnation window to 30 days", () => {
		expect(DROPOFF_STAGNATION_DAYS_DEFAULT).toBe(30);
	});

	it("bounds the stagnation window between 1 and 180 days", () => {
		expect(DROPOFF_STAGNATION_DAYS_MIN).toBe(1);
		expect(DROPOFF_STAGNATION_DAYS_MAX).toBe(180);
		expect(DROPOFF_STAGNATION_DAYS_DEFAULT).toBeGreaterThanOrEqual(
			DROPOFF_STAGNATION_DAYS_MIN,
		);
		expect(DROPOFF_STAGNATION_DAYS_DEFAULT).toBeLessThanOrEqual(
			DROPOFF_STAGNATION_DAYS_MAX,
		);
	});
});
