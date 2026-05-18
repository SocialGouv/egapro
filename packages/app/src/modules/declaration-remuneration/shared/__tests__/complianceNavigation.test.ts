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
	it("returns the second-decl recap when second declaration is submitted", () => {
		expect(
			getCseOpinionPreviousHref({
				firstDeclarationPathChoice: "corrective_action",
				hasSubmittedSecondDeclaration: true,
			}),
		).toBe("/declaration-remuneration/recapitulatif?type=correction");
	});

	it("returns the joint evaluation page when path = joint_evaluation", () => {
		expect(
			getCseOpinionPreviousHref({
				firstDeclarationPathChoice: "joint_evaluation",
				hasSubmittedSecondDeclaration: false,
			}),
		).toBe(
			"/declaration-remuneration/parcours-conformite/evaluation-conjointe",
		);
	});

	it("returns the compliance path choice when path = justify", () => {
		expect(
			getCseOpinionPreviousHref({
				firstDeclarationPathChoice: "justify",
				hasSubmittedSecondDeclaration: false,
			}),
		).toBe("/declaration-remuneration/parcours-conformite");
	});

	it("returns the first-decl recap when no compliance path was chosen", () => {
		expect(
			getCseOpinionPreviousHref({
				firstDeclarationPathChoice: null,
				hasSubmittedSecondDeclaration: false,
			}),
		).toBe("/declaration-remuneration/recapitulatif");
	});
});
