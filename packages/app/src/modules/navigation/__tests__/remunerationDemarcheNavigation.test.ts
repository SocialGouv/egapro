import { describe, expect, it } from "vitest";
import type { CseOpinionOrigin } from "..";
import {
	CSE_OPINION_PREVIOUS_HREF,
	getCompliancePathHref,
	getCompliancePathPreviousHref,
	getCseOpinionPreviousHref,
	getCurrentStageHref,
	getDemarcheStageHref,
	getPostComplianceDestination,
	resolveCseOpinionOrigin,
} from "..";

const CONFIRMATION_PATH =
	"/declaration-remuneration/parcours-conformite/confirmation";
const CSE_OPINION_PATH = "/avis-cse";
const COMPLIANCE_PATH_PATH = "/declaration-remuneration/parcours-conformite";
const JOINT_EVALUATION_PATH =
	"/declaration-remuneration/parcours-conformite/evaluation-conjointe";
const CORRECTIVE_STEP1_PATH =
	"/declaration-remuneration/parcours-conformite/etape/1";
const FIRST_DECLARATION_RECAP_PATH = "/declaration-remuneration/etape/6";
const SECOND_DECLARATION_RECAP_PATH =
	"/declaration-remuneration/parcours-conformite/etape/3";
const TUNNEL_ENTRY_PATH = "/declaration-remuneration";

// A sentinel no engine state maps to, so a test asserting the terminal branch
// cannot pass by accidentally hitting one of the seven others.
const TERMINAL_SENTINEL = "/mon-espace";

describe("getDemarcheStageHref", () => {
	it.each([
		["draft", TUNNEL_ENTRY_PATH],
		["awaiting_compliance_path_choice", COMPLIANCE_PATH_PATH],
		["awaiting_revision_choice", COMPLIANCE_PATH_PATH],
		["corrective_actions_chosen", CORRECTIVE_STEP1_PATH],
		["joint_evaluation_chosen", JOINT_EVALUATION_PATH],
		["revised_joint_evaluation_chosen", JOINT_EVALUATION_PATH],
		["awaiting_cse_opinion", CSE_OPINION_PATH],
	] as const)("routes %s to %s, whatever the terminal policy", (status, expected) => {
		expect(getDemarcheStageHref(status, TERMINAL_SENTINEL)).toBe(expected);
	});

	it("defers the terminal state to the caller's policy", () => {
		expect(getDemarcheStageHref("demarche_completed", TERMINAL_SENTINEL)).toBe(
			TERMINAL_SENTINEL,
		);
	});
});

describe("getPostComplianceDestination", () => {
	it("sends a démarche that still owes an opinion to the CSE funnel", () => {
		expect(getPostComplianceDestination(true)).toBe(CSE_OPINION_PATH);
	});

	it("sends a démarche that owes no opinion to the confirmation page", () => {
		expect(getPostComplianceDestination(false)).toBe(CONFIRMATION_PATH);
	});

	// The /avis-cse layout redirects here once it establishes no opinion is due,
	// so any destination under /avis-cse makes that layout redirect onto itself.
	it("never sends a démarche that owes no opinion into the CSE funnel", () => {
		const destination = getPostComplianceDestination(false);

		expect(destination).not.toBe(CSE_OPINION_PATH);
		expect(destination.startsWith(`${CSE_OPINION_PATH}/`)).toBe(false);
	});
});

describe("getCurrentStageHref", () => {
	// Engine-stage-driven destinations live in fsmMirrors.conformance.test.ts
	// (#3975). Owned here: the null status, outside DECLARATION_FSM_STATUSES, and
	// the terminal status, whose destination branches on a caller-supplied flag
	// the engine does not model.
	it("falls back to the compliance path for a declaration without FSM projection (null status)", () => {
		expect(getCurrentStageHref(null, true)).toBe(COMPLIANCE_PATH_PATH);
	});

	it("keeps a completed démarche that still owes an opinion on the CSE funnel", () => {
		expect(getCurrentStageHref("demarche_completed", true)).toBe(
			CSE_OPINION_PATH,
		);
	});

	it("sends a completed démarche that owes no opinion to the confirmation page", () => {
		expect(getCurrentStageHref("demarche_completed", false)).toBe(
			CONFIRMATION_PATH,
		);
	});

	it("reads the shared table for a non-terminal state", () => {
		expect(getCurrentStageHref("corrective_actions_chosen", true)).toBe(
			CORRECTIVE_STEP1_PATH,
		);
	});
});

describe("getCompliancePathHref", () => {
	it.each([
		true,
		false,
	])("routes corrective_action to the second declaration funnel (cseOpinionRequired: %s)", (cseOpinionRequired) => {
		expect(getCompliancePathHref("corrective_action", cseOpinionRequired)).toBe(
			CORRECTIVE_STEP1_PATH,
		);
	});

	it.each([
		true,
		false,
	])("routes joint_evaluation to the joint evaluation form (cseOpinionRequired: %s)", (cseOpinionRequired) => {
		expect(getCompliancePathHref("joint_evaluation", cseOpinionRequired)).toBe(
			JOINT_EVALUATION_PATH,
		);
	});

	it("routes justify to the CSE opinion page when an opinion is due", () => {
		expect(getCompliancePathHref("justify", true)).toBe(CSE_OPINION_PATH);
	});

	it("routes justify to the confirmation page when no opinion is due", () => {
		expect(getCompliancePathHref("justify", false)).toBe(CONFIRMATION_PATH);
	});
});

describe("resolveCseOpinionOrigin", () => {
	it.each([
		[
			"direct submit (no gap, round 1)",
			{
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				hasSubmittedSecondDeclaration: false,
			},
			"submit_to_cse_opinion_directly",
		],
		[
			"justify chosen in round 1",
			{
				firstDeclarationPathChoice: "justify",
				secondDeclarationPathChoice: null,
				hasSubmittedSecondDeclaration: false,
			},
			"choose_path_initial_justify_with_cse",
		],
		[
			"joint evaluation submitted in round 1",
			{
				firstDeclarationPathChoice: "joint_evaluation",
				secondDeclarationPathChoice: null,
				hasSubmittedSecondDeclaration: false,
			},
			"submit_joint_evaluation_initial_with_cse",
		],
		[
			"second declaration submitted with the gap resolved",
			{
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: null,
				hasSubmittedSecondDeclaration: true,
			},
			"submit_second_declaration_resolved_with_cse",
		],
		[
			"justify chosen in round 2",
			{
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: "justify",
				hasSubmittedSecondDeclaration: true,
			},
			"choose_path_revised_justify_with_cse",
		],
		[
			"joint evaluation submitted in round 2",
			{
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: "joint_evaluation",
				hasSubmittedSecondDeclaration: true,
			},
			"submit_joint_evaluation_revised_with_cse",
		],
	] as const)("names %s as its engine transition", (_case, context, origin) => {
		expect(resolveCseOpinionOrigin(context)).toBe(origin);
	});

	it("prefers the round-2 choice once the second declaration is submitted", () => {
		expect(
			resolveCseOpinionOrigin({
				firstDeclarationPathChoice: "justify",
				secondDeclarationPathChoice: "joint_evaluation",
				hasSubmittedSecondDeclaration: true,
			}),
		).toBe("submit_joint_evaluation_revised_with_cse");
	});

	it("reaches every branch of the provenance table", () => {
		const contexts = [
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
		const reached = new Set<CseOpinionOrigin>(
			contexts.map((context) => resolveCseOpinionOrigin(context)),
		);

		expect([...reached].sort()).toEqual(
			Object.keys(CSE_OPINION_PREVIOUS_HREF).sort(),
		);
	});
});

describe("getCseOpinionPreviousHref", () => {
	it("returns first-decl recap step when arriving from direct submit (no gap, round 1)", () => {
		expect(
			getCseOpinionPreviousHref({
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				hasSubmittedSecondDeclaration: false,
			}),
		).toBe(FIRST_DECLARATION_RECAP_PATH);
	});

	it("returns the compliance path choice when path = justify (round 1)", () => {
		expect(
			getCseOpinionPreviousHref({
				firstDeclarationPathChoice: "justify",
				secondDeclarationPathChoice: null,
				hasSubmittedSecondDeclaration: false,
			}),
		).toBe(COMPLIANCE_PATH_PATH);
	});

	it("returns the joint evaluation page when path = joint_evaluation (round 1)", () => {
		expect(
			getCseOpinionPreviousHref({
				firstDeclarationPathChoice: "joint_evaluation",
				secondDeclarationPathChoice: null,
				hasSubmittedSecondDeclaration: false,
			}),
		).toBe(JOINT_EVALUATION_PATH);
	});

	it("returns second-decl recap step when second decl submitted with no revision (resolved)", () => {
		expect(
			getCseOpinionPreviousHref({
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: null,
				hasSubmittedSecondDeclaration: true,
			}),
		).toBe(SECOND_DECLARATION_RECAP_PATH);
	});

	it("returns the compliance path choice when second-decl path = justify (round 2)", () => {
		expect(
			getCseOpinionPreviousHref({
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: "justify",
				hasSubmittedSecondDeclaration: true,
			}),
		).toBe(COMPLIANCE_PATH_PATH);
	});

	it("returns the joint evaluation page when second-decl path = joint_evaluation (round 2)", () => {
		expect(
			getCseOpinionPreviousHref({
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: "joint_evaluation",
				hasSubmittedSecondDeclaration: true,
			}),
		).toBe(JOINT_EVALUATION_PATH);
	});
});

describe("getCompliancePathPreviousHref", () => {
	it("returns the first-declaration recap when the path choice is still round 1", () => {
		expect(getCompliancePathPreviousHref(false)).toBe(
			FIRST_DECLARATION_RECAP_PATH,
		);
	});

	it("returns the second-declaration recap when the path choice is round 2", () => {
		expect(getCompliancePathPreviousHref(true)).toBe(
			SECOND_DECLARATION_RECAP_PATH,
		);
	});
});
