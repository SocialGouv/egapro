import { describe, expect, it } from "vitest";
import { DECLARATION_FSM_STATUSES } from "~/modules/domain";
import type { PanelVariant } from "~/modules/my-space";
// Cross-module conformance test: computePanelVariant/computeCtaHref/DeclarationItem are internal to my-space (not exposed by the barrel); exporting them would be a production change out of scope for this test-only ticket.
import {
	computeCtaHref,
	computePanelVariant,
} from "~/modules/my-space/declarationProcessState";
import type { DeclarationItem } from "~/modules/my-space/types";
import {
	CSE_OPINION_PREVIOUS_HREF,
	getCurrentStageHref,
	resolveCseOpinionOrigin,
} from "~/modules/navigation";
import {
	COMPLIANCE_CONFIRMATION,
	COMPLIANCE_JOINT_EVALUATION,
	COMPLIANCE_PATH,
	CSE_OPINION,
	complianceStepHref,
	DECLARATION_REMUNERATION,
} from "~/modules/routes";
import { loadRules } from "../engine";

const rules = loadRules("2027.1");

const SIREN = "123456789";

// Screens the mirrors resolve to, indexed by the engine stage a state carries in
// v2027.1.json. Anchoring the expectation on the engine's own stage metadata is
// what makes this a conformance test: the shared table read through the funnel
// (getCurrentStageHref) and through the panel (computeCtaHref), plus the panel
// variant, must all land on the screen the engine assigns to that stage.
const ENTRY = DECLARATION_REMUNERATION;
const COMPLIANCE = COMPLIANCE_PATH;
const CORRECTIVE_STEP1 = complianceStepHref(1);
const JOINT_EVAL = COMPLIANCE_JOINT_EVALUATION;
const CSE = CSE_OPINION;
const CONFIRMATION = COMPLIANCE_CONFIRMATION;

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
		notSubject: false,
		...overrides,
	};
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

// Provenance: every engine transition landing on `awaiting_cse_opinion` must have
// a branch in the navigation table, so adding one without wiring "Précédent"
// breaks here rather than sending the user to the wrong page.
const CSE_OPINION_ORIGIN_CONTEXTS = [
	{
		firstDeclarationPathChoice: null,
		secondDeclarationPathChoice: null,
		hasSubmittedSecondDeclaration: false,
	},
	{
		firstDeclarationPathChoice: "justify",
		secondDeclarationPathChoice: null,
		hasSubmittedSecondDeclaration: false,
	},
	{
		firstDeclarationPathChoice: "joint_evaluation",
		secondDeclarationPathChoice: null,
		hasSubmittedSecondDeclaration: false,
	},
	{
		firstDeclarationPathChoice: null,
		secondDeclarationPathChoice: null,
		hasSubmittedSecondDeclaration: true,
	},
	{
		firstDeclarationPathChoice: null,
		secondDeclarationPathChoice: "justify",
		hasSubmittedSecondDeclaration: true,
	},
	{
		firstDeclarationPathChoice: null,
		secondDeclarationPathChoice: "joint_evaluation",
		hasSubmittedSecondDeclaration: true,
	},
] as const;

describe("provenance conformance — engine transitions into awaiting_cse_opinion", () => {
	const incoming = rules.transitions.filter(
		(transition) => transition.to === "awaiting_cse_opinion",
	);

	it("the engine has incoming transitions to check", () => {
		expect(incoming.length).toBeGreaterThan(0);
	});

	it("the provenance table names exactly the engine transitions that land there", () => {
		expect(Object.keys(CSE_OPINION_PREVIOUS_HREF).sort()).toEqual(
			incoming.map((transition) => transition.id).sort(),
		);
	});

	it.each(
		incoming,
	)("transition $id has a previous-page branch", (transition) => {
		const href =
			CSE_OPINION_PREVIOUS_HREF[
				transition.id as keyof typeof CSE_OPINION_PREVIOUS_HREF
			];
		expect(href, `no provenance branch for ${transition.id}`).toBeDefined();
		expect(href).not.toBe(CSE);
	});

	it("every engine transition is reachable from a stored démarche", () => {
		const reached = CSE_OPINION_ORIGIN_CONTEXTS.map((context) =>
			resolveCseOpinionOrigin(context),
		);
		expect([...new Set(reached)].sort()).toEqual(
			incoming.map((transition) => transition.id).sort(),
		);
	});
});

describe("mirror conformance — engine states (non-terminal)", () => {
	it.each(
		rules.states.filter((s) => s.id !== "demarche_completed"),
	)("state $id (stage $stage): nav, panel and cta converge on the same screen", (state) => {
		const expected = STAGE_SCREEN[String(state.stage)];
		if (!expected)
			throw new Error(`No screen mapping for stage ${state.stage}`);
		// cseOpinionRequired is only consulted by the nav mirror in the terminal
		// state, so a non-terminal state resolves to the same screen either way.
		expect(getCurrentStageHref(state.id, true)).toBe(expected.screen);
		expect(getCurrentStageHref(state.id, false)).toBe(expected.screen);
		const decl = makeDeclaration({ fsmStatus: state.id });
		expect(computePanelVariant(decl)).toBe(expected.variant);
		expect(computeCtaHref(decl)).toBe(expected.screen);
	});
});

describe("mirror conformance — engine transition destinations", () => {
	it.each(
		rules.transitions,
	)("transition $id → $to: mirrors consistent with the engine stage", (transition) => {
		const to = transition.to;
		if (to === "demarche_completed") {
			// Terminal state: only the healthy hasSubmittedCseOpinion:true branch is asserted here —
			// the full cseOpinionRequired × hasSubmittedCseOpinion matrix, incl. the no-opinion closed branch (#3939), lives in the dedicated describe below.
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
		expect(computeCtaHref(decl)).toBe(expected.screen);
	});
});

describe("exhaustiveness — every FSM status is covered by the table and the panel", () => {
	it.each(
		DECLARATION_FSM_STATUSES,
	)("status %s: nav and panel return a defined destination", (status) => {
		const nav = getCurrentStageHref(status, true);
		expect(typeof nav).toBe("string");
		expect(nav.length).toBeGreaterThan(0);
		const decl = makeDeclaration({ fsmStatus: status });
		expect(computePanelVariant(decl)).toBeDefined();
		const cta = computeCtaHref(decl);
		expect(typeof cta).toBe("string");
		expect(cta.length).toBeGreaterThan(0);
	});
});

// The one state the shared table refuses to decide: it hands the terminal
// destination back to each surface, and the two answers below are the product
// behaviour that survived the merge of the two mirrors (#4113).
describe("demarche_completed — mirror coherence × (cseOpinionRequired × hasSubmittedCseOpinion)", () => {
	it('opinion due, not yet deposited: panel "cse" and nav → /avis-cse (coherent)', () => {
		const decl = makeDeclaration({
			fsmStatus: "demarche_completed",
			hasSubmittedCseOpinion: false,
			cseRequired: true,
		});
		expect(computePanelVariant(decl)).toBe("cse");
		expect(computeCtaHref(decl)).toBe(CSE);
		expect(getCurrentStageHref("demarche_completed", true)).toBe(CSE);
	});

	it('opinion due and deposited: panel "closed"; nav keeps /avis-cse (CSE deposit re-submittable)', () => {
		const decl = makeDeclaration({
			fsmStatus: "demarche_completed",
			hasSubmittedCseOpinion: true,
		});
		// Legitimate surface difference, not a bug: the my-space panel reports the
		// démarche as closed, while the recap « Suivant » keeps offering the still
		// re-submittable /avis-cse page (up to 4 opinions). Each mirror is correct
		// for its own surface, so no coherence is asserted between them here.
		expect(computePanelVariant(decl)).toBe("closed");
		expect(computeCtaHref(decl)).toBe(ENTRY);
		expect(getCurrentStageHref("demarche_completed", true)).toBe(CSE);
	});

	it('no opinion due, none deposited: the panel should be "closed", not "cse" (#3939)', () => {
		const decl = makeDeclaration({
			fsmStatus: "demarche_completed",
			hasSubmittedCseOpinion: false,
		});
		// The nav mirror is correct: a démarche owing no opinion lands on
		// /confirmation, never on the CSE page. computePanelVariant now consumes
		// cseRequired (false by default in makeDeclaration) and returns "closed"
		// for this case (#3939).
		expect(getCurrentStageHref("demarche_completed", false)).toBe(CONFIRMATION);
		expect(computePanelVariant(decl)).toBe("closed");
	});

	it('no opinion due, one "deposited": panel "closed" and nav → /confirmation (coherent, démarche closed)', () => {
		const decl = makeDeclaration({
			fsmStatus: "demarche_completed",
			hasSubmittedCseOpinion: true,
		});
		expect(computePanelVariant(decl)).toBe("closed");
		expect(getCurrentStageHref("demarche_completed", false)).toBe(CONFIRMATION);
	});
});
