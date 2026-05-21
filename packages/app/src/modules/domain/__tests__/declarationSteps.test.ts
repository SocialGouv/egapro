import { describe, expect, it } from "vitest";

import {
	DECLARATION_STEPS,
	FUNNEL_COMPLIANCE_KEY_STEPS,
	FUNNEL_DROP_ALERT_THRESHOLD,
	FUNNEL_MAIN_KEY_STEPS,
	FUNNEL_REVISION_KEY_STEPS,
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

describe("FUNNEL_MAIN_KEY_STEPS (S-K19-D1)", () => {
	it("exposes the 4 main funnel jalons in chronological order", () => {
		expect(FUNNEL_MAIN_KEY_STEPS.map((s) => s.key)).toEqual([
			"draft_started",
			"indicators_filled",
			"submitted",
			"demarche_completed",
		]);
	});

	it("uses non-empty French labels and unique keys within the funnel", () => {
		for (const entry of FUNNEL_MAIN_KEY_STEPS) {
			expect(entry.label.length).toBeGreaterThan(0);
		}
		const keys = FUNNEL_MAIN_KEY_STEPS.map((s) => s.key);
		expect(new Set(keys).size).toBe(keys.length);
	});
});

describe("FUNNEL_COMPLIANCE_KEY_STEPS (S-K19-D2)", () => {
	it("exposes the 4 compliance funnel jalons in chronological order", () => {
		expect(FUNNEL_COMPLIANCE_KEY_STEPS.map((s) => s.key)).toEqual([
			"submitted_with_alert",
			"path_chosen",
			"corrective_action_submitted",
			"demarche_completed",
		]);
	});

	it("uses non-empty French labels and unique keys within the funnel", () => {
		for (const entry of FUNNEL_COMPLIANCE_KEY_STEPS) {
			expect(entry.label.length).toBeGreaterThan(0);
		}
		const keys = FUNNEL_COMPLIANCE_KEY_STEPS.map((s) => s.key);
		expect(new Set(keys).size).toBe(keys.length);
	});
});

describe("FUNNEL_REVISION_KEY_STEPS (S-K19-D4)", () => {
	it("exposes the 4 revision funnel jalons in chronological order", () => {
		expect(FUNNEL_REVISION_KEY_STEPS.map((s) => s.key)).toEqual([
			"revision_required",
			"revision_path_chosen",
			"revision_action_submitted",
			"demarche_completed",
		]);
	});

	it("uses non-empty French labels and unique keys within the funnel", () => {
		for (const entry of FUNNEL_REVISION_KEY_STEPS) {
			expect(entry.label.length).toBeGreaterThan(0);
		}
		const keys = FUNNEL_REVISION_KEY_STEPS.map((s) => s.key);
		expect(new Set(keys).size).toBe(keys.length);
	});
});

describe("FUNNEL_DROP_ALERT_THRESHOLD (S-K19-D3)", () => {
	it("is a positive number strictly between 0 and 100", () => {
		expect(typeof FUNNEL_DROP_ALERT_THRESHOLD).toBe("number");
		expect(FUNNEL_DROP_ALERT_THRESHOLD).toBeGreaterThan(0);
		expect(FUNNEL_DROP_ALERT_THRESHOLD).toBeLessThan(100);
	});
});
