import { describe, expect, it } from "vitest";

import {
	computeCtaHref,
	computePanelVariant,
} from "../declarationProcessState";
import type { DeclarationItem } from "../types";

const SIREN = "532847196";

function makeDeclaration(
	overrides: Partial<DeclarationItem> = {},
): DeclarationItem {
	return {
		type: "remuneration",
		siren: SIREN,
		year: 2026,
		status: "done",
		currentStep: 6,
		updatedAt: new Date(),
		firstDeclarationPathChoice: null,
		secondDeclarationSubmittedAt: null,
		demarcheCompletedAt: null,
		cseOpinionCompletedAt: null,
		hasJointEvaluationFile: false,
		hasPrefillData: false,
		...overrides,
	};
}

describe("computePanelVariant", () => {
	it('returns "start" when declaration is undefined', () => {
		expect(computePanelVariant(undefined)).toBe("start");
	});

	it('returns "start" when status is to_complete', () => {
		expect(
			computePanelVariant(makeDeclaration({ status: "to_complete" })),
		).toBe("start");
	});

	it('returns "start" when status is in_progress', () => {
		expect(
			computePanelVariant(makeDeclaration({ status: "in_progress" })),
		).toBe("start");
	});

	it('returns "compliance_choice" when done but no compliance path', () => {
		expect(
			computePanelVariant(
				makeDeclaration({ firstDeclarationPathChoice: null }),
			),
		).toBe("compliance_choice");
	});

	it('returns "compliance" for corrective_action without second declaration', () => {
		expect(
			computePanelVariant(
				makeDeclaration({ firstDeclarationPathChoice: "corrective_action" }),
			),
		).toBe("compliance");
	});

	it('returns "evaluation" for corrective_action with submitted second declaration', () => {
		expect(
			computePanelVariant(
				makeDeclaration({
					firstDeclarationPathChoice: "corrective_action",
					secondDeclarationSubmittedAt: new Date(),
				}),
			),
		).toBe("evaluation");
	});

	it('returns "evaluation" for joint_evaluation without file', () => {
		expect(
			computePanelVariant(
				makeDeclaration({
					firstDeclarationPathChoice: "joint_evaluation",
					hasJointEvaluationFile: false,
				}),
			),
		).toBe("evaluation");
	});

	it('returns "cse" for joint_evaluation with file uploaded', () => {
		expect(
			computePanelVariant(
				makeDeclaration({
					firstDeclarationPathChoice: "joint_evaluation",
					hasJointEvaluationFile: true,
				}),
			),
		).toBe("cse");
	});

	it('returns "cse" for justify path', () => {
		expect(
			computePanelVariant(
				makeDeclaration({ firstDeclarationPathChoice: "justify" }),
			),
		).toBe("cse");
	});

	it('returns "cse" when compliance completed but no CSE opinion', () => {
		expect(
			computePanelVariant(
				makeDeclaration({
					firstDeclarationPathChoice: "corrective_action",
					demarcheCompletedAt: new Date(),
					cseOpinionCompletedAt: null,
				}),
			),
		).toBe("cse");
	});

	it('returns "closed" when compliance completed and CSE opinion deposited', () => {
		expect(
			computePanelVariant(
				makeDeclaration({
					firstDeclarationPathChoice: "corrective_action",
					demarcheCompletedAt: new Date(),
					cseOpinionCompletedAt: new Date(),
				}),
			),
		).toBe("closed");
	});

	it('returns "closed" for justify path with CSE opinion deposited', () => {
		expect(
			computePanelVariant(
				makeDeclaration({
					firstDeclarationPathChoice: "justify",
					cseOpinionCompletedAt: new Date(),
				}),
			),
		).toBe("closed");
	});
});

describe("computeCtaHref", () => {
	it("returns declaration URL when no declaration", () => {
		expect(computeCtaHref(undefined, SIREN)).toBe(
			`/declaration-remuneration?siren=${SIREN}`,
		);
	});

	it("returns declaration URL when status is not done", () => {
		expect(
			computeCtaHref(makeDeclaration({ status: "in_progress" }), SIREN),
		).toBe(`/declaration-remuneration?siren=${SIREN}`);
	});

	it("returns compliance choice URL when no compliance path", () => {
		expect(computeCtaHref(makeDeclaration(), SIREN)).toBe(
			`/declaration-remuneration/parcours-conformite?siren=${SIREN}`,
		);
	});

	it("returns second declaration step 1 URL for corrective_action", () => {
		expect(
			computeCtaHref(
				makeDeclaration({ firstDeclarationPathChoice: "corrective_action" }),
				SIREN,
			),
		).toBe(
			`/declaration-remuneration/parcours-conformite/etape/1?siren=${SIREN}`,
		);
	});

	it("returns compliance choice URL for corrective_action with submitted second declaration", () => {
		expect(
			computeCtaHref(
				makeDeclaration({
					firstDeclarationPathChoice: "corrective_action",
					secondDeclarationSubmittedAt: new Date(),
				}),
				SIREN,
			),
		).toBe(`/declaration-remuneration/parcours-conformite?siren=${SIREN}`);
	});

	it("returns evaluation conjointe URL for joint_evaluation without file", () => {
		expect(
			computeCtaHref(
				makeDeclaration({ firstDeclarationPathChoice: "joint_evaluation" }),
				SIREN,
			),
		).toBe(
			`/declaration-remuneration/parcours-conformite/evaluation-conjointe?siren=${SIREN}`,
		);
	});

	it("returns CSE URL for joint_evaluation with file uploaded", () => {
		expect(
			computeCtaHref(
				makeDeclaration({
					firstDeclarationPathChoice: "joint_evaluation",
					hasJointEvaluationFile: true,
				}),
				SIREN,
			),
		).toBe(`/avis-cse?siren=${SIREN}`);
	});

	it("returns CSE URL for justify path", () => {
		expect(
			computeCtaHref(
				makeDeclaration({ firstDeclarationPathChoice: "justify" }),
				SIREN,
			),
		).toBe(`/avis-cse?siren=${SIREN}`);
	});

	it("returns CSE URL when compliance completed but no CSE opinion", () => {
		expect(
			computeCtaHref(
				makeDeclaration({
					firstDeclarationPathChoice: "corrective_action",
					demarcheCompletedAt: new Date(),
				}),
				SIREN,
			),
		).toBe(`/avis-cse?siren=${SIREN}`);
	});

	it("returns declaration URL when compliance completed and CSE deposited", () => {
		expect(
			computeCtaHref(
				makeDeclaration({
					firstDeclarationPathChoice: "corrective_action",
					demarcheCompletedAt: new Date(),
					cseOpinionCompletedAt: new Date(),
				}),
				SIREN,
			),
		).toBe(`/declaration-remuneration?siren=${SIREN}`);
	});
});
