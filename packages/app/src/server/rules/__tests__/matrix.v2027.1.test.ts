import { beforeEach, describe, expect, it } from "vitest";
import type { Facts } from "../engine";
import { _resetCacheForTests, applyAction, loadRules } from "../engine";

beforeEach(() => {
	_resetCacheForTests();
});

const rules = loadRules("2027.1");

type EventExpectation = {
	type: string;
	value?: string;
	round?: 1 | 2;
};

type Case = {
	label: string;
	from: string;
	action: string;
	facts: Facts;
	expectedTo: string;
	expectedEvents: EventExpectation[];
};

function base(currentState: string, overrides: Partial<Facts> = {}): Facts {
	return {
		currentState,
		workforce: 300,
		indicatorGCalculated: true,
		gap: 10,
		hasCse: true,
		isTriennialYear: true,
		...overrides,
	};
}

const MATRIX: Case[] = [
	{
		label:
			"submit_to_compliance_path_choice: complianceProcessRequired (gap>=5, ind G, workforce>=100)",
		from: "draft",
		action: "submit",
		facts: base("draft", {
			workforce: 300,
			gap: 10,
			indicatorGCalculated: true,
			hasCse: true,
		}),
		expectedTo: "awaiting_compliance_path_choice",
		expectedEvents: [{ type: "submit" }],
	},
	{
		label:
			"submit_to_cse_opinion_directly: no compliance process, but cseRequired",
		from: "draft",
		action: "submit",
		facts: base("draft", {
			workforce: 120,
			gap: 2,
			indicatorGCalculated: false,
			hasCse: true,
		}),
		expectedTo: "awaiting_cse_opinion",
		expectedEvents: [{ type: "submit" }],
	},
	{
		label:
			"submit_to_demarche_completed_directly: no compliance process, no cse",
		from: "draft",
		action: "submit",
		facts: base("draft", {
			workforce: 60,
			gap: 2,
			indicatorGCalculated: false,
			hasCse: false,
		}),
		expectedTo: "demarche_completed",
		expectedEvents: [{ type: "submit" }, { type: "demarche_complete" }],
	},

	{
		label: "choose_path_initial_justify_with_cse",
		from: "awaiting_compliance_path_choice",
		action: "choose_compliance_path",
		facts: base("awaiting_compliance_path_choice", {
			cseRequired: true,
			action: { path: "justify" },
		}),
		expectedTo: "awaiting_cse_opinion",
		expectedEvents: [{ type: "path_choice", value: "justify", round: 1 }],
	},
	{
		label: "choose_path_initial_justify_without_cse",
		from: "awaiting_compliance_path_choice",
		action: "choose_compliance_path",
		facts: base("awaiting_compliance_path_choice", {
			cseRequired: false,
			action: { path: "justify" },
		}),
		expectedTo: "demarche_completed",
		expectedEvents: [
			{ type: "path_choice", value: "justify", round: 1 },
			{ type: "demarche_complete" },
		],
	},
	{
		label: "choose_path_initial_corrective_action",
		from: "awaiting_compliance_path_choice",
		action: "choose_compliance_path",
		facts: base("awaiting_compliance_path_choice", {
			action: { path: "corrective_action" },
		}),
		expectedTo: "corrective_actions_chosen",
		expectedEvents: [
			{ type: "path_choice", value: "corrective_action", round: 1 },
		],
	},
	{
		label: "choose_path_initial_joint_evaluation",
		from: "awaiting_compliance_path_choice",
		action: "choose_compliance_path",
		facts: base("awaiting_compliance_path_choice", {
			action: { path: "joint_evaluation" },
		}),
		expectedTo: "joint_evaluation_chosen",
		expectedEvents: [
			{ type: "path_choice", value: "joint_evaluation", round: 1 },
		],
	},

	{
		label: "submit_second_declaration_persistent_gap",
		from: "corrective_actions_chosen",
		action: "submit_second_declaration",
		facts: base("corrective_actions_chosen", {
			cseRequired: true,
			action: { stillHasGap: true },
		}),
		expectedTo: "awaiting_revision_choice",
		expectedEvents: [{ type: "second_declaration_submit", round: 2 }],
	},
	{
		label: "submit_second_declaration_resolved_with_cse",
		from: "corrective_actions_chosen",
		action: "submit_second_declaration",
		facts: base("corrective_actions_chosen", {
			cseRequired: true,
			action: { stillHasGap: false },
		}),
		expectedTo: "awaiting_cse_opinion",
		expectedEvents: [{ type: "second_declaration_submit", round: 2 }],
	},
	{
		label: "submit_second_declaration_resolved_without_cse",
		from: "corrective_actions_chosen",
		action: "submit_second_declaration",
		facts: base("corrective_actions_chosen", {
			cseRequired: false,
			action: { stillHasGap: false },
		}),
		expectedTo: "demarche_completed",
		expectedEvents: [
			{ type: "second_declaration_submit", round: 2 },
			{ type: "demarche_complete" },
		],
	},

	// Re-submit (#3955): after a first second-declaration submit landed the
	// démarche in awaiting_revision_choice (persistent gap), the declarant can
	// re-modify and re-submit before the deadline. The transition recomputes the
	// residual gap and re-routes exactly like the corrective_actions_chosen path.
	{
		label:
			"submit_second_declaration re-submit from awaiting_revision_choice, gap still persists",
		from: "awaiting_revision_choice",
		action: "submit_second_declaration",
		facts: base("awaiting_revision_choice", {
			cseRequired: true,
			action: { stillHasGap: true },
		}),
		expectedTo: "awaiting_revision_choice",
		expectedEvents: [{ type: "second_declaration_submit", round: 2 }],
	},
	{
		label:
			"submit_second_declaration re-submit from awaiting_revision_choice, gap resolved with CSE",
		from: "awaiting_revision_choice",
		action: "submit_second_declaration",
		facts: base("awaiting_revision_choice", {
			cseRequired: true,
			action: { stillHasGap: false },
		}),
		expectedTo: "awaiting_cse_opinion",
		expectedEvents: [{ type: "second_declaration_submit", round: 2 }],
	},
	{
		label:
			"submit_second_declaration re-submit from awaiting_revision_choice, gap resolved without CSE",
		from: "awaiting_revision_choice",
		action: "submit_second_declaration",
		facts: base("awaiting_revision_choice", {
			cseRequired: false,
			action: { stillHasGap: false },
		}),
		expectedTo: "demarche_completed",
		expectedEvents: [
			{ type: "second_declaration_submit", round: 2 },
			{ type: "demarche_complete" },
		],
	},

	{
		label: "submit_joint_evaluation_initial_with_cse",
		from: "joint_evaluation_chosen",
		action: "submit_joint_evaluation",
		facts: base("joint_evaluation_chosen", { cseRequired: true }),
		expectedTo: "awaiting_cse_opinion",
		expectedEvents: [{ type: "joint_evaluation_submit", round: 1 }],
	},
	{
		label: "submit_joint_evaluation_initial_without_cse",
		from: "joint_evaluation_chosen",
		action: "submit_joint_evaluation",
		facts: base("joint_evaluation_chosen", { cseRequired: false }),
		expectedTo: "demarche_completed",
		expectedEvents: [
			{ type: "joint_evaluation_submit", round: 1 },
			{ type: "demarche_complete" },
		],
	},

	{
		label: "choose_path_revised_justify_with_cse",
		from: "awaiting_revision_choice",
		action: "choose_compliance_path",
		facts: base("awaiting_revision_choice", {
			cseRequired: true,
			action: { path: "justify" },
		}),
		expectedTo: "awaiting_cse_opinion",
		expectedEvents: [{ type: "path_choice", value: "justify", round: 2 }],
	},
	{
		label: "choose_path_revised_justify_without_cse",
		from: "awaiting_revision_choice",
		action: "choose_compliance_path",
		facts: base("awaiting_revision_choice", {
			cseRequired: false,
			action: { path: "justify" },
		}),
		expectedTo: "demarche_completed",
		expectedEvents: [
			{ type: "path_choice", value: "justify", round: 2 },
			{ type: "demarche_complete" },
		],
	},
	{
		label: "choose_path_revised_joint_evaluation",
		from: "awaiting_revision_choice",
		action: "choose_compliance_path",
		facts: base("awaiting_revision_choice", {
			action: { path: "joint_evaluation" },
		}),
		expectedTo: "revised_joint_evaluation_chosen",
		expectedEvents: [
			{ type: "path_choice", value: "joint_evaluation", round: 2 },
		],
	},

	{
		label: "submit_joint_evaluation_revised_with_cse",
		from: "revised_joint_evaluation_chosen",
		action: "submit_joint_evaluation",
		facts: base("revised_joint_evaluation_chosen", { cseRequired: true }),
		expectedTo: "awaiting_cse_opinion",
		expectedEvents: [{ type: "joint_evaluation_submit", round: 2 }],
	},
	{
		label: "submit_joint_evaluation_revised_without_cse",
		from: "revised_joint_evaluation_chosen",
		action: "submit_joint_evaluation",
		facts: base("revised_joint_evaluation_chosen", { cseRequired: false }),
		expectedTo: "demarche_completed",
		expectedEvents: [
			{ type: "joint_evaluation_submit", round: 2 },
			{ type: "demarche_complete" },
		],
	},

	{
		label: "submit_cse_opinion → demarche_completed",
		from: "awaiting_cse_opinion",
		action: "submit_cse_opinion",
		facts: base("awaiting_cse_opinion"),
		expectedTo: "demarche_completed",
		expectedEvents: [
			{ type: "cse_opinion_submit" },
			{ type: "demarche_complete" },
		],
	},
];

describe("matrix v2027.1 — all 18 transitions (incl. every from-state)", () => {
	it.each(MATRIX)("$label", ({ facts, action, expectedTo, expectedEvents }) => {
		const result = applyAction(facts, action, rules);
		expect(result.nextStatus).toBe(expectedTo);
		expect(result.events).toEqual(expectedEvents);
	});
});

describe("submit_cse_opinion is re-entrant from demarche_completed", () => {
	it("re-accepts the action once the démarche is completed, staying completed", () => {
		// The CSE deposit form stays editable and re-submittable after completion,
		// so submit_cse_opinion must loop on demarche_completed instead of throwing.
		const facts = base("demarche_completed");
		const result = applyAction(facts, "submit_cse_opinion", rules);

		expect(result.nextStatus).toBe("demarche_completed");
		expect(result.events).toEqual([
			{ type: "cse_opinion_submit" },
			{ type: "demarche_complete" },
		]);
	});
});

describe("applyAction — no matching transition throws", () => {
	it("throws when no transition matches the current state + action", () => {
		const facts = base("demarche_completed");
		expect(() => applyAction(facts, "submit", rules)).toThrow(
			/No matching transition/,
		);
	});

	it("does not throw when at least one guard matches a draft submit", () => {
		const facts = base("draft", {
			workforce: 300,
			gap: 10,
			indicatorGCalculated: false,
			hasCse: false,
		});
		expect(() => applyAction(facts, "submit", rules)).not.toThrow();
	});
});

describe("loadRules — caching", () => {
	it("returns the same object reference on repeated calls", () => {
		const r1 = loadRules("2027.1");
		const r2 = loadRules("2027.1");
		expect(r1).toBe(r2);
	});

	it("throws for unknown version", () => {
		expect(() => loadRules("9999.0")).toThrow(/Unknown rules version/);
	});
});

describe("events shape", () => {
	it("submit transitions always emit a `submit` event", () => {
		const facts = base("draft", {
			workforce: 60,
			gap: 2,
			indicatorGCalculated: false,
			hasCse: false,
		});
		const result = applyAction(facts, "submit", rules);
		expect(result.events[0]).toEqual({ type: "submit" });
	});

	it("path_choice events carry the chosen value and round", () => {
		const facts = base("awaiting_compliance_path_choice", {
			action: { path: "corrective_action" },
		});
		const result = applyAction(facts, "choose_compliance_path", rules);
		expect(result.events).toEqual([
			{ type: "path_choice", value: "corrective_action", round: 1 },
		]);
	});

	it("revised path_choice events carry round=2", () => {
		const facts = base("awaiting_revision_choice", {
			cseRequired: true,
			action: { path: "justify" },
		});
		const result = applyAction(facts, "choose_compliance_path", rules);
		expect(result.events[0]).toMatchObject({ round: 2 });
	});
});
