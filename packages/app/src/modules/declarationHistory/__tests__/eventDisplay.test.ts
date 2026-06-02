import { describe, expect, it } from "vitest";

import {
	type DeclarationEventType,
	getHistoryEventDisplay,
	type HistoryEvent,
} from "../index";

function buildEvent(
	eventType: DeclarationEventType,
	round: number | null = null,
): HistoryEvent {
	return { eventType, value: null, round };
}

describe("getHistoryEventDisplay", () => {
	it("submit: returns non-empty label and recap page link", () => {
		const result = getHistoryEventDisplay(buildEvent("submit"));
		expect(result.label).toBe("Soumission de la déclaration");
		expect(result.pageLabel).toBe("Récapitulatif de votre déclaration");
		expect(result.pageHref).toBe("/declaration-remuneration/recapitulatif");
	});

	it("path_choice: returns non-empty label and compliance path link", () => {
		const result = getHistoryEventDisplay(buildEvent("path_choice"));
		expect(result.label).toBe("Choix du parcours de mise en conformité");
		expect(result.pageLabel).toBe("Parcours de mise en conformité");
		expect(result.pageHref).toBe(
			"/declaration-remuneration/parcours-conformite",
		);
	});

	it("second_declaration_submit: returns non-empty label and compliance path link", () => {
		const result = getHistoryEventDisplay(
			buildEvent("second_declaration_submit"),
		);
		expect(result.label).toBe("Soumission de la seconde déclaration");
		expect(result.pageLabel).toBe("Parcours de mise en conformité");
		expect(result.pageHref).toBe(
			"/declaration-remuneration/parcours-conformite",
		);
	});

	it("joint_evaluation_submit: returns non-empty label and joint evaluation link", () => {
		const result = getHistoryEventDisplay(
			buildEvent("joint_evaluation_submit"),
		);
		expect(result.label).toBe("Dépôt de l'évaluation conjointe");
		expect(result.pageLabel).toBe("Évaluation conjointe");
		expect(result.pageHref).toBe(
			"/declaration-remuneration/parcours-conformite/evaluation-conjointe",
		);
	});

	it("cse_opinion_submit: returns non-empty label and CSE opinion link", () => {
		const result = getHistoryEventDisplay(buildEvent("cse_opinion_submit"));
		expect(result.label).toBe("Dépôt de l'avis CSE");
		expect(result.pageLabel).toBe("Avis CSE");
		expect(result.pageHref).toBe("/avis-cse");
	});

	it("cancel: returns non-empty label and no page link", () => {
		const result = getHistoryEventDisplay(buildEvent("cancel"));
		expect(result.label).toBe("Annulation de la déclaration");
		expect(result.pageLabel).toBeNull();
		expect(result.pageHref).toBeNull();
	});

	it("demarche_complete: returns non-empty label and no page link", () => {
		const result = getHistoryEventDisplay(buildEvent("demarche_complete"));
		expect(result.label).toBe("Démarche finalisée");
		expect(result.pageLabel).toBeNull();
		expect(result.pageHref).toBeNull();
	});

	it("step_change with round=5: maps via STEP_TITLES and builds etape href", () => {
		const result = getHistoryEventDisplay(buildEvent("step_change", 5));
		expect(result.label).toBe("Modification de la page");
		expect(result.pageLabel).toBe(
			"Écart de rémunération par catégories de salariés (salaire de base et primes)",
		);
		expect(result.pageHref).toBe("/declaration-remuneration/etape/5");
	});

	it("step_change with round=0: maps to Introduction step", () => {
		const result = getHistoryEventDisplay(buildEvent("step_change", 0));
		expect(result.label).toBe("Modification de la page");
		expect(result.pageLabel).toBe("Introduction");
		expect(result.pageHref).toBe("/declaration-remuneration/etape/0");
	});

	it("step_change with null round: returns null page link", () => {
		const result = getHistoryEventDisplay(buildEvent("step_change", null));
		expect(result.label).toBe("Modification de la page");
		expect(result.pageLabel).toBeNull();
		expect(result.pageHref).toBeNull();
	});

	it("step_change with out-of-bounds round: returns null page link", () => {
		const result = getHistoryEventDisplay(buildEvent("step_change", 999));
		expect(result.label).toBe("Modification de la page");
		expect(result.pageLabel).toBeNull();
		expect(result.pageHref).toBeNull();
	});

	it("all event types return a non-empty French label", () => {
		const eventTypes: DeclarationEventType[] = [
			"submit",
			"path_choice",
			"second_declaration_submit",
			"joint_evaluation_submit",
			"cse_opinion_submit",
			"cancel",
			"demarche_complete",
			"step_change",
		];
		for (const eventType of eventTypes) {
			const result = getHistoryEventDisplay(buildEvent(eventType));
			expect(result.label.length).toBeGreaterThan(0);
		}
	});

	it("throws for unknown event type at runtime (exhaustive guard)", () => {
		const unknownEvent = {
			eventType: "unknown_type" as unknown as DeclarationEventType,
			value: null,
			round: null,
		};
		expect(() => getHistoryEventDisplay(unknownEvent)).toThrow(
			"Unknown event type",
		);
	});
});
