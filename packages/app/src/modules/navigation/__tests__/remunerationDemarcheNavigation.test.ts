import { describe, expect, it } from "vitest";
import { DECLARATION_FSM_STATUSES } from "~/modules/domain";
import {
	getCompliancePathHref,
	getCurrentStageHref,
	getDemarcheResumeHref,
	getDemarcheStageHref,
	getPostComplianceDestination,
} from "..";

const CONFIRMATION_PATH =
	"/declaration-remuneration/parcours-conformite/confirmation";
const CSE_OPINION_PATH = "/avis-cse";
const COMPLIANCE_PATH_PATH = "/declaration-remuneration/parcours-conformite";
const JOINT_EVALUATION_PATH =
	"/declaration-remuneration/parcours-conformite/evaluation-conjointe";
const CORRECTIVE_STEP1_PATH =
	"/declaration-remuneration/parcours-conformite/etape/1";
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

describe("getDemarcheResumeHref", () => {
	it("resumes corrective actions on their recap once corrected data is saved", () => {
		expect(
			getDemarcheResumeHref(
				"corrective_actions_chosen",
				TERMINAL_SENTINEL,
				true,
			),
		).toBe(SECOND_DECLARATION_RECAP_PATH);
	});

	it("resumes corrective actions on their first step while nothing is saved", () => {
		expect(
			getDemarcheResumeHref(
				"corrective_actions_chosen",
				TERMINAL_SENTINEL,
				false,
			),
		).toBe(CORRECTIVE_STEP1_PATH);
	});

	it.each(
		DECLARATION_FSM_STATUSES.filter(
			(status) => status !== "corrective_actions_chosen",
		).flatMap((status) => [
			[status, true],
			[status, false],
		]),
	)("follows the stage table for %s (corrected data saved: %s)", (status, secondDeclarationSaved) => {
		expect(
			getDemarcheResumeHref(status, TERMINAL_SENTINEL, secondDeclarationSaved),
		).toBe(getDemarcheStageHref(status, TERMINAL_SENTINEL));
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
