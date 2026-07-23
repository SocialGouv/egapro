import { describe, expect, it } from "vitest";
import { declarationEventTypeEnum } from "~/server/db/schema";
import {
	DECLARATION_EVENT_TYPE_LABELS,
	getStatusHistoryLabel,
} from "../statusHistoryLabels";

describe("getStatusHistoryLabel", () => {
	it("returns the base label for submit", () => {
		expect(getStatusHistoryLabel("submit", null)).toBe(
			"Soumission de la déclaration",
		);
	});

	it("returns combined label for path_choice with joint_evaluation", () => {
		expect(getStatusHistoryLabel("path_choice", "joint_evaluation")).toBe(
			"Choix du parcours — Évaluation conjointe",
		);
	});

	it("returns combined label for path_choice with corrective_action", () => {
		expect(getStatusHistoryLabel("path_choice", "corrective_action")).toBe(
			"Choix du parcours — Actions correctives",
		);
	});

	it("returns combined label for path_choice with justify", () => {
		expect(getStatusHistoryLabel("path_choice", "justify")).toBe(
			"Choix du parcours — Justification de l'écart",
		);
	});

	it("returns base label for path_choice with null value", () => {
		expect(getStatusHistoryLabel("path_choice", null)).toBe(
			"Choix du parcours",
		);
	});

	it("returns base label for path_choice with unknown string value", () => {
		expect(getStatusHistoryLabel("path_choice", "unknown_string")).toBe(
			"Choix du parcours",
		);
	});

	it("returns the base label for cancel", () => {
		expect(getStatusHistoryLabel("cancel", null)).toBe(
			"Annulation de la déclaration",
		);
	});

	it("returns a non-empty string for every key in DECLARATION_EVENT_TYPE_LABELS", () => {
		for (const key of Object.keys(DECLARATION_EVENT_TYPE_LABELS) as Array<
			keyof typeof DECLARATION_EVENT_TYPE_LABELS
		>) {
			const result = getStatusHistoryLabel(key, null);
			expect(result.length).toBeGreaterThan(0);
		}
	});

	// The public SUIT vocabulary must expose every DB event type except step_change,
	// which is an internal stepper-transition event (indicators A–F) that must not
	// leak into the export (#3950).
	it("exposes exactly the declaration_event_type DB values minus the internal step_change", () => {
		const publicVocabulary = Object.keys(DECLARATION_EVENT_TYPE_LABELS).sort();
		const dbEventTypesExceptInternal = declarationEventTypeEnum.enumValues
			.filter((value) => value !== "step_change")
			.sort();

		expect(publicVocabulary).toEqual(dbEventTypesExceptInternal);
		expect(Object.keys(DECLARATION_EVENT_TYPE_LABELS)).not.toContain(
			"step_change",
		);
	});
});
