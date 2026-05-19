import { describe, expect, it } from "vitest";
import {
	getCseOpinionPreviousHref,
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
	it("returns null when arriving from direct submit (no gap, round 1)", () => {
		expect(
			getCseOpinionPreviousHref({
				firstDeclarationPathChoice: null,
				secondDeclarationPathChoice: null,
				hasSubmittedSecondDeclaration: false,
			}),
		).toBeNull();
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

	it("returns null when second decl submitted with no revision (resolved)", () => {
		expect(
			getCseOpinionPreviousHref({
				firstDeclarationPathChoice: "corrective_action",
				secondDeclarationPathChoice: null,
				hasSubmittedSecondDeclaration: true,
			}),
		).toBeNull();
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
