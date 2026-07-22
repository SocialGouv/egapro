import { describe, expect, it } from "vitest";
import { getCurrentStageHref } from "~/modules/declaration-remuneration/shared/complianceNavigation";
import { DECLARATION_FSM_STATUSES } from "~/modules/domain";
import type { PanelVariant } from "~/modules/my-space";
// Cross-module conformance test: computePanelVariant/computeCtaHref/DeclarationItem are internal to my-space (not exposed by the barrel); exporting them would be a production change out of scope for this test-only ticket.
import {
	computeCtaHref,
	computePanelVariant,
} from "~/modules/my-space/declarationProcessState";
import type { DeclarationItem } from "~/modules/my-space/types";
import { loadRules } from "../engine";

const rules = loadRules("2027.1");

const SIREN = "123456789";

// Screens the two mirrors resolve to, indexed by the engine stage a state carries
// in v2027.1.json. Anchoring the expectation on the engine's own stage metadata is
// what makes this a conformance test: the nav mirror (getCurrentStageHref) and the
// panel mirror (computePanelVariant/computeCtaHref) must both send the user to the
// screen the engine assigns to that stage.
const ENTRY = "/declaration-remuneration";
const COMPLIANCE = "/declaration-remuneration/parcours-conformite";
const CORRECTIVE_STEP1 =
	"/declaration-remuneration/parcours-conformite/etape/1";
const JOINT_EVAL =
	"/declaration-remuneration/parcours-conformite/evaluation-conjointe";
const CSE = "/avis-cse";
const CONFIRMATION =
	"/declaration-remuneration/parcours-conformite/confirmation";

const STAGE_SCREEN: Record<string, { screen: string; variant: PanelVariant }> =
	{
		null: { screen: ENTRY, variant: "start" },
		"2": { screen: COMPLIANCE, variant: "compliance_choice" },
		"3": { screen: CORRECTIVE_STEP1, variant: "compliance" },
		"4": { screen: COMPLIANCE, variant: "compliance_choice" },
		"5": { screen: JOINT_EVAL, variant: "evaluation" },
		"6": { screen: CSE, variant: "cse" },
	};

function makeDeclaration(
	overrides: Partial<DeclarationItem> = {},
): DeclarationItem {
	return {
		type: "remuneration",
		siren: SIREN,
		year: 2027,
		status: "in_progress",
		fsmStatus: "draft",
		currentStep: 6,
		updatedAt: null,
		firstDeclarationPathChoice: null,
		secondDeclarationPathChoice: null,
		hasSubmittedSecondDeclaration: false,
		hasSubmittedCseOpinion: false,
		cseRequired: false,
		hasJointEvaluationFile: false,
		hasPrefillData: false,
		...overrides,
	};
}

function stripSiren(url: string): string {
	return url.split("?")[0] ?? url;
}

describe("engine conformance to the shared FSM vocabulary", () => {
	it("the v2027.1.json states cover exactly DECLARATION_FSM_STATUSES", () => {
		const engineStates = rules.states.map((s) => s.id).sort();
		const shared = [...DECLARATION_FSM_STATUSES].sort();
		expect(engineStates).toEqual(shared);
	});

	it("every transition lands on a known engine state", () => {
		const ids = new Set(rules.states.map((s) => s.id));
		for (const transition of rules.transitions) {
			expect(ids.has(transition.to)).toBe(true);
		}
	});
});

describe("mirror conformance — engine states (non-terminal)", () => {
	it.each(
		rules.states.filter((s) => s.id !== "demarche_completed"),
	)("state $id (stage $stage): nav, panel and cta converge on the same screen", (state) => {
		const expected = STAGE_SCREEN[String(state.stage)];
		if (!expected)
			throw new Error(`No screen mapping for stage ${state.stage}`);
		// hasCse is only consulted by the nav mirror in the terminal state, so a
		// non-terminal state must resolve to the same screen for both hasCse values.
		expect(getCurrentStageHref(state.id, true)).toBe(expected.screen);
		expect(getCurrentStageHref(state.id, false)).toBe(expected.screen);
		const decl = makeDeclaration({ fsmStatus: state.id });
		expect(computePanelVariant(decl)).toBe(expected.variant);
		expect(stripSiren(computeCtaHref(decl, SIREN))).toBe(expected.screen);
	});
});

describe("mirror conformance — engine transition destinations", () => {
	it.each(
		rules.transitions,
	)("transition $id → $to: mirrors consistent with the engine stage", (transition) => {
		const to = transition.to;
		if (to === "demarche_completed") {
			// Terminal state: only the healthy hasSubmittedCseOpinion:true branch is asserted here —
			// the full hasCse × hasSubmittedCseOpinion matrix, incl. the known-bad false branch (it.fails #3945), lives in the dedicated describe below.
			expect(getCurrentStageHref(to, true)).toBe(CSE);
			expect(getCurrentStageHref(to, false)).toBe(CONFIRMATION);
			expect(
				computePanelVariant(
					makeDeclaration({ fsmStatus: to, hasSubmittedCseOpinion: true }),
				),
			).toBe("closed");
			return;
		}
		const state = rules.states.find((s) => s.id === to);
		if (!state) throw new Error(`Transition ${transition.id} → unknown ${to}`);
		const expected = STAGE_SCREEN[String(state.stage)];
		if (!expected)
			throw new Error(`No screen mapping for stage ${state.stage}`);
		expect(getCurrentStageHref(to, true)).toBe(expected.screen);
		const decl = makeDeclaration({ fsmStatus: to });
		expect(computePanelVariant(decl)).toBe(expected.variant);
		expect(stripSiren(computeCtaHref(decl, SIREN))).toBe(expected.screen);
	});
});

describe("exhaustiveness — every FSM status is covered by both mirrors", () => {
	it.each(
		DECLARATION_FSM_STATUSES,
	)("status %s: nav and panel return a defined destination", (status) => {
		const nav = getCurrentStageHref(status, true);
		expect(typeof nav).toBe("string");
		expect(nav.length).toBeGreaterThan(0);
		const decl = makeDeclaration({ fsmStatus: status });
		expect(computePanelVariant(decl)).toBeDefined();
		const cta = computeCtaHref(decl, SIREN);
		expect(typeof cta).toBe("string");
		expect(cta.length).toBeGreaterThan(0);
	});
});

describe("demarche_completed — mirror coherence × (hasCse × hasSubmittedCseOpinion)", () => {
	it('with CSE, opinion not yet deposited: panel "cse" and nav → /avis-cse (coherent)', () => {
		const decl = makeDeclaration({
			fsmStatus: "demarche_completed",
			hasSubmittedCseOpinion: false,
		});
		expect(computePanelVariant(decl)).toBe("cse");
		expect(stripSiren(computeCtaHref(decl, SIREN))).toBe(CSE);
		expect(getCurrentStageHref("demarche_completed", true)).toBe(CSE);
	});

	it('with CSE, opinion deposited: panel "closed"; nav keeps /avis-cse (CSE deposit re-submittable)', () => {
		const decl = makeDeclaration({
			fsmStatus: "demarche_completed",
			hasSubmittedCseOpinion: true,
		});
		// Legitimate surface difference, not a bug: the my-space panel reports the
		// démarche as closed, while the recap « Suivant » keeps offering the still
		// re-submittable /avis-cse page (up to 4 opinions). Each mirror is correct
		// for its own surface, so no coherence is asserted between them here.
		expect(computePanelVariant(decl)).toBe("closed");
		expect(stripSiren(computeCtaHref(decl, SIREN))).toBe(ENTRY);
		expect(getCurrentStageHref("demarche_completed", true)).toBe(CSE);
	});

	it.fails('without CSE, opinion not deposited: the panel should be "closed", not "cse" (#3945)', () => {
		const decl = makeDeclaration({
			fsmStatus: "demarche_completed",
			hasSubmittedCseOpinion: false,
		});
		// The nav mirror is correct: a no-CSE company lands on /confirmation, never
		// on the CSE page. The panel input carries no hasCse and cannot tell this
		// case apart from a with-CSE company, so it wrongly returns « cse » (and a
		// /avis-cse CTA). Correct behaviour: « closed ». Fails until #3945 lands
		// (see also the duplicate report #3939).
		expect(getCurrentStageHref("demarche_completed", false)).toBe(CONFIRMATION);
		expect(computePanelVariant(decl)).toBe("closed");
	});

	it('without CSE, opinion "deposited": panel "closed" and nav → /confirmation (coherent, démarche closed)', () => {
		const decl = makeDeclaration({
			fsmStatus: "demarche_completed",
			hasSubmittedCseOpinion: true,
		});
		expect(computePanelVariant(decl)).toBe("closed");
		expect(getCurrentStageHref("demarche_completed", false)).toBe(CONFIRMATION);
	});
});
