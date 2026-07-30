import { describe, expect, it } from "vitest";
import {
	getCseOpinionPreviousHref,
	getCurrentStageHref,
	getPostComplianceDestination,
} from "../complianceNavigation";

const CONFIRMATION_PATH =
	"/declaration-remuneration/parcours-conformite/confirmation";
const CSE_OPINION_PATH = "/avis-cse";

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

describe("getCseOpinionPreviousHref", () => {
	it("returns first-decl recap step when arriving from direct submit (no gap, round 1)", () => {
		expect(
			getCseOpinionPreviousHref({
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				hasSubmittedSecondDeclaration: false,
			}),
		).toBe("/declaration-remuneration/etape/6");
	});

	it("returns the compliance path choice when path = justify (round 1)", () => {
		expect(
			getCseOpinionPreviousHref({
				firstDeclarationPathChoice: "justify",
				secondDeclarationPathChoice: null,
				hasSubmittedSecondDeclaration: false,
			}),
		).toBe("/declaration-remuneration/parcours-conformite");
	});

	it("returns the joint evaluation page when path = joint_evaluation (round 1)", () => {
		expect(
			getCseOpinionPreviousHref({
				firstDeclarationPathChoice: "joint_evaluation",
				secondDeclarationPathChoice: null,
				hasSubmittedSecondDeclaration: false,
			}),
		).toBe(
			"/declaration-remuneration/parcours-conformite/evaluation-conjointe",
		);
	});

	it("returns second-decl recap step when second decl submitted with no revision (resolved)", () => {
		expect(
			getCseOpinionPreviousHref({
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: null,
				hasSubmittedSecondDeclaration: true,
			}),
		).toBe("/declaration-remuneration/parcours-conformite/etape/3");
	});

	it("returns the compliance path choice when second-decl path = justify (round 2)", () => {
		expect(
			getCseOpinionPreviousHref({
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: "justify",
				hasSubmittedSecondDeclaration: true,
			}),
		).toBe("/declaration-remuneration/parcours-conformite");
	});

	it("returns the joint evaluation page when second-decl path = joint_evaluation (round 2)", () => {
		expect(
			getCseOpinionPreviousHref({
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: "joint_evaluation",
				hasSubmittedSecondDeclaration: true,
			}),
		).toBe(
			"/declaration-remuneration/parcours-conformite/evaluation-conjointe",
		);
	});
});

describe("getCurrentStageHref", () => {
	// Engine-stage-driven destinations live in fsmMirrors.conformance.test.ts
	// (#3975). Owned here: the null status, outside DECLARATION_FSM_STATUSES, and
	// the terminal status, whose destination branches on a caller-supplied flag
	// the engine does not model.
	it("falls back to the compliance path for a declaration without FSM projection (null status)", () => {
		expect(getCurrentStageHref(null, true)).toBe(
			"/declaration-remuneration/parcours-conformite",
		);
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
});
