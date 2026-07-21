import { describe, expect, it } from "vitest";
import {
	getCseOpinionPreviousHref,
	getCurrentStageHref,
	getPostComplianceDestination,
} from "../complianceNavigation";

describe("getPostComplianceDestination", () => {
	it("returns /avis-cse when hasCse is true", () => {
		expect(getPostComplianceDestination(true)).toBe("/avis-cse");
	});

	it("returns confirmation path when hasCse is false", () => {
		expect(getPostComplianceDestination(false)).toBe(
			"/declaration-remuneration/parcours-conformite/confirmation",
		);
	});

	it("returns confirmation path when hasCse is null", () => {
		expect(getPostComplianceDestination(null)).toBe(
			"/declaration-remuneration/parcours-conformite/confirmation",
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
	it("returns /avis-cse for awaiting_cse_opinion", () => {
		expect(getCurrentStageHref("awaiting_cse_opinion", true)).toBe("/avis-cse");
	});

	it("returns /avis-cse for demarche_completed when CSE is required", () => {
		expect(getCurrentStageHref("demarche_completed", true)).toBe("/avis-cse");
	});

	it("returns the no-CSE confirmation page for demarche_completed without CSE", () => {
		expect(getCurrentStageHref("demarche_completed", false)).toBe(
			"/declaration-remuneration/parcours-conformite/confirmation",
		);
	});

	it("returns the compliance choice page for awaiting_compliance_path_choice", () => {
		expect(getCurrentStageHref("awaiting_compliance_path_choice", true)).toBe(
			"/declaration-remuneration/parcours-conformite",
		);
	});

	it("returns the compliance choice page for awaiting_revision_choice", () => {
		expect(getCurrentStageHref("awaiting_revision_choice", true)).toBe(
			"/declaration-remuneration/parcours-conformite",
		);
	});

	it("returns the corrective actions first step for corrective_actions_chosen", () => {
		expect(getCurrentStageHref("corrective_actions_chosen", true)).toBe(
			"/declaration-remuneration/parcours-conformite/etape/1",
		);
	});

	it("returns the joint evaluation page for joint_evaluation_chosen", () => {
		expect(getCurrentStageHref("joint_evaluation_chosen", true)).toBe(
			"/declaration-remuneration/parcours-conformite/evaluation-conjointe",
		);
	});

	it("returns the joint evaluation page for revised_joint_evaluation_chosen", () => {
		expect(getCurrentStageHref("revised_joint_evaluation_chosen", true)).toBe(
			"/declaration-remuneration/parcours-conformite/evaluation-conjointe",
		);
	});

	it("returns the declaration entry for draft (no more silent parcours-conformite fallback)", () => {
		expect(getCurrentStageHref("draft", true)).toBe(
			"/declaration-remuneration",
		);
	});

	it("returns the compliance path for a null status", () => {
		expect(getCurrentStageHref(null, true)).toBe(
			"/declaration-remuneration/parcours-conformite",
		);
	});
});
