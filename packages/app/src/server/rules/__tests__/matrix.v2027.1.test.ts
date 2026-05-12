import { beforeEach, describe, expect, it } from "vitest";
import type { Facts } from "../engine";
import { _resetCacheForTests, applyAction, loadRules } from "../engine";

beforeEach(() => {
	_resetCacheForTests();
});

const rules = loadRules("2027.1");

type Case = {
	label: string;
	from: string;
	action: string;
	facts: Facts;
	expectedTo: string;
	expectedWriteKeys: string[];
};

const FIXED_NOW = new Date("2027-04-01T00:00:00.000Z");

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
	// ── submit from draft ──────────────────────────────────────────────────────

	{
		label:
			"submit_to_compliance_path_choice: phase2Required (gap>=5, ind G, workforce>=100)",
		from: "draft",
		action: "submit",
		facts: base("draft", {
			workforce: 300,
			gap: 10,
			indicatorGCalculated: true,
			hasCse: true,
		}),
		expectedTo: "awaiting_compliance_path_choice",
		expectedWriteKeys: [
			"submittedAt",
			"phase2Required",
			"cseRequired",
			"indicatorGRequired",
			"rulesVersion",
		],
	},
	{
		label: "submit_to_cse_opinion_directly: no phase2, but cseRequired",
		from: "draft",
		action: "submit",
		facts: base("draft", {
			workforce: 120,
			gap: 2,
			indicatorGCalculated: false,
			hasCse: true,
		}),
		expectedTo: "awaiting_cse_opinion",
		expectedWriteKeys: [
			"submittedAt",
			"phase2Required",
			"cseRequired",
			"indicatorGRequired",
			"rulesVersion",
		],
	},
	{
		label: "submit_to_demarche_completed_directly: no phase2, no cse",
		from: "draft",
		action: "submit",
		facts: base("draft", {
			workforce: 60,
			gap: 2,
			indicatorGCalculated: false,
			hasCse: false,
		}),
		expectedTo: "demarche_completed",
		expectedWriteKeys: [
			"submittedAt",
			"demarcheCompletedAt",
			"phase2Required",
			"cseRequired",
			"indicatorGRequired",
			"rulesVersion",
		],
	},

	// ── choose_compliance_path from awaiting_compliance_path_choice ────────────

	{
		label: "choose_path_initial_justify_with_cse: justify + cseRequired=true",
		from: "awaiting_compliance_path_choice",
		action: "choose_compliance_path",
		facts: base("awaiting_compliance_path_choice", {
			cseRequired: true,
			action: { path: "justify" },
		}),
		expectedTo: "awaiting_cse_opinion",
		expectedWriteKeys: [
			"firstDeclarationPathChoice",
			"firstDeclarationPathChoiceAt",
		],
	},
	{
		label:
			"choose_path_initial_justify_without_cse: justify + cseRequired=false",
		from: "awaiting_compliance_path_choice",
		action: "choose_compliance_path",
		facts: base("awaiting_compliance_path_choice", {
			cseRequired: false,
			action: { path: "justify" },
		}),
		expectedTo: "demarche_completed",
		expectedWriteKeys: [
			"firstDeclarationPathChoice",
			"firstDeclarationPathChoiceAt",
			"demarcheCompletedAt",
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
		expectedWriteKeys: [
			"firstDeclarationPathChoice",
			"firstDeclarationPathChoiceAt",
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
		expectedWriteKeys: [
			"firstDeclarationPathChoice",
			"firstDeclarationPathChoiceAt",
		],
	},

	// ── submit_second_declaration from corrective_actions_chosen ──────────────

	{
		label: "submit_second_declaration_persistent_gap: stillHasGap=true",
		from: "corrective_actions_chosen",
		action: "submit_second_declaration",
		facts: base("corrective_actions_chosen", {
			cseRequired: true,
			action: { stillHasGap: true },
		}),
		expectedTo: "awaiting_revision_choice",
		expectedWriteKeys: [
			"secondDeclarationSubmittedAt",
			"phase2RevisionRequired",
		],
	},
	{
		label:
			"submit_second_declaration_resolved_with_cse: gap resolved, cse required",
		from: "corrective_actions_chosen",
		action: "submit_second_declaration",
		facts: base("corrective_actions_chosen", {
			cseRequired: true,
			action: { stillHasGap: false },
		}),
		expectedTo: "awaiting_cse_opinion",
		expectedWriteKeys: [
			"secondDeclarationSubmittedAt",
			"phase2RevisionRequired",
		],
	},
	{
		label:
			"submit_second_declaration_resolved_without_cse: gap resolved, no cse",
		from: "corrective_actions_chosen",
		action: "submit_second_declaration",
		facts: base("corrective_actions_chosen", {
			cseRequired: false,
			action: { stillHasGap: false },
		}),
		expectedTo: "demarche_completed",
		expectedWriteKeys: [
			"secondDeclarationSubmittedAt",
			"phase2RevisionRequired",
			"demarcheCompletedAt",
		],
	},

	// ── submit_joint_evaluation from joint_evaluation_chosen ──────────────────

	{
		label: "submit_joint_evaluation_initial_with_cse",
		from: "joint_evaluation_chosen",
		action: "submit_joint_evaluation",
		facts: base("joint_evaluation_chosen", { cseRequired: true }),
		expectedTo: "awaiting_cse_opinion",
		expectedWriteKeys: ["jointEvaluationSubmittedAt"],
	},
	{
		label: "submit_joint_evaluation_initial_without_cse",
		from: "joint_evaluation_chosen",
		action: "submit_joint_evaluation",
		facts: base("joint_evaluation_chosen", { cseRequired: false }),
		expectedTo: "demarche_completed",
		expectedWriteKeys: ["jointEvaluationSubmittedAt", "demarcheCompletedAt"],
	},

	// ── choose_compliance_path from awaiting_revision_choice ─────────────────

	{
		label: "choose_path_revised_justify_with_cse",
		from: "awaiting_revision_choice",
		action: "choose_compliance_path",
		facts: base("awaiting_revision_choice", {
			cseRequired: true,
			action: { path: "justify" },
		}),
		expectedTo: "awaiting_cse_opinion",
		expectedWriteKeys: [
			"secondDeclarationPathChoice",
			"secondDeclarationPathChoiceAt",
		],
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
		expectedWriteKeys: [
			"secondDeclarationPathChoice",
			"secondDeclarationPathChoiceAt",
			"demarcheCompletedAt",
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
		expectedWriteKeys: [
			"secondDeclarationPathChoice",
			"secondDeclarationPathChoiceAt",
		],
	},

	// ── submit_joint_evaluation from revised_joint_evaluation_chosen ──────────

	{
		label: "submit_joint_evaluation_revised_with_cse",
		from: "revised_joint_evaluation_chosen",
		action: "submit_joint_evaluation",
		facts: base("revised_joint_evaluation_chosen", { cseRequired: true }),
		expectedTo: "awaiting_cse_opinion",
		expectedWriteKeys: ["jointEvaluationSubmittedAt"],
	},
	{
		label: "submit_joint_evaluation_revised_without_cse",
		from: "revised_joint_evaluation_chosen",
		action: "submit_joint_evaluation",
		facts: base("revised_joint_evaluation_chosen", { cseRequired: false }),
		expectedTo: "demarche_completed",
		expectedWriteKeys: ["jointEvaluationSubmittedAt", "demarcheCompletedAt"],
	},

	// ── submit_cse_opinion from awaiting_cse_opinion ──────────────────────────

	{
		label: "submit_cse_opinion → demarche_completed",
		from: "awaiting_cse_opinion",
		action: "submit_cse_opinion",
		facts: base("awaiting_cse_opinion"),
		expectedTo: "demarche_completed",
		expectedWriteKeys: ["cseOpinionCompletedAt", "demarcheCompletedAt"],
	},
];

describe("matrix v2027.1 — all 18 transitions", () => {
	it.each(MATRIX)("$label", ({
		facts,
		action,
		expectedTo,
		expectedWriteKeys,
	}) => {
		const result = applyAction(facts, action, rules, FIXED_NOW);

		expect(result.nextState).toBe(expectedTo);

		for (const key of expectedWriteKeys) {
			expect(
				result.setFlags,
				`expected write key "${key}" to be present`,
			).toHaveProperty(key);
		}
	});
});

describe("applyAction — no matching transition throws", () => {
	it("throws when no transition matches the current state + action", () => {
		const facts = base("demarche_completed");
		expect(() => applyAction(facts, "submit", rules)).toThrow(
			/No matching transition/,
		);
	});

	it("throws when the guard is not satisfied for any transition", () => {
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

describe("write source resolution", () => {
	it("$now writes resolve to the provided Date", () => {
		const facts = base("draft", {
			workforce: 60,
			gap: 2,
			indicatorGCalculated: false,
			hasCse: false,
		});
		const result = applyAction(facts, "submit", rules, FIXED_NOW);
		expect(result.setFlags.submittedAt).toBe(FIXED_NOW);
		expect(result.setFlags.demarcheCompletedAt).toBe(FIXED_NOW);
	});

	it("{ value: ... } writes resolve to the literal value", () => {
		const facts = base("draft", {
			workforce: 60,
			gap: 2,
			indicatorGCalculated: false,
			hasCse: false,
		});
		const result = applyAction(facts, "submit", rules, FIXED_NOW);
		expect(result.setFlags.rulesVersion).toBe("2027.1");
	});

	it("{ compute: ... } writes resolve to a boolean computation result", () => {
		const facts = base("draft", {
			workforce: 300,
			gap: 10,
			indicatorGCalculated: true,
			hasCse: true,
		});
		const result = applyAction(facts, "submit", rules, FIXED_NOW);
		expect(result.setFlags.phase2Required).toBe(true);
		expect(result.setFlags.cseRequired).toBe(true);
		expect(result.setFlags.indicatorGRequired).toBe(true);
	});
});
