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
		compliancePath: null,
		secondDeclarationStatus: null,
		complianceCompletedAt: null,
		hasCseOpinion: false,
		hasJointEvaluationFile: false,
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

	it('returns "start" when done but no compliance path', () => {
		expect(computePanelVariant(makeDeclaration({ compliancePath: null }))).toBe(
			"start",
		);
	});

	it('returns "compliance" for corrective_action without second declaration', () => {
		expect(
			computePanelVariant(
				makeDeclaration({ compliancePath: "corrective_action" }),
			),
		).toBe("compliance");
	});

	it('returns "evaluation" for corrective_action with submitted second declaration', () => {
		expect(
			computePanelVariant(
				makeDeclaration({
					compliancePath: "corrective_action",
					secondDeclarationStatus: "submitted",
				}),
			),
		).toBe("evaluation");
	});

	it('returns "evaluation" for joint_evaluation without file', () => {
		expect(
			computePanelVariant(
				makeDeclaration({
					compliancePath: "joint_evaluation",
					hasJointEvaluationFile: false,
				}),
			),
		).toBe("evaluation");
	});

	it('returns "cse" for joint_evaluation with file uploaded', () => {
		expect(
			computePanelVariant(
				makeDeclaration({
					compliancePath: "joint_evaluation",
					hasJointEvaluationFile: true,
				}),
			),
		).toBe("cse");
	});

	it('returns "cse" for justify path', () => {
		expect(
			computePanelVariant(makeDeclaration({ compliancePath: "justify" })),
		).toBe("cse");
	});

	it('returns "cse" when compliance completed but no CSE opinion', () => {
		expect(
			computePanelVariant(
				makeDeclaration({
					compliancePath: "corrective_action",
					complianceCompletedAt: new Date(),
					hasCseOpinion: false,
				}),
			),
		).toBe("cse");
	});

	it('returns "closed" when compliance completed and CSE opinion deposited', () => {
		expect(
			computePanelVariant(
				makeDeclaration({
					compliancePath: "corrective_action",
					complianceCompletedAt: new Date(),
					hasCseOpinion: true,
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
				makeDeclaration({ compliancePath: "corrective_action" }),
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
					compliancePath: "corrective_action",
					secondDeclarationStatus: "submitted",
				}),
				SIREN,
			),
		).toBe(`/declaration-remuneration/parcours-conformite?siren=${SIREN}`);
	});

	it("returns evaluation conjointe URL for joint_evaluation without file", () => {
		expect(
			computeCtaHref(
				makeDeclaration({ compliancePath: "joint_evaluation" }),
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
					compliancePath: "joint_evaluation",
					hasJointEvaluationFile: true,
				}),
				SIREN,
			),
		).toBe(`/avis-cse?siren=${SIREN}`);
	});

	it("returns CSE URL for justify path", () => {
		expect(
			computeCtaHref(makeDeclaration({ compliancePath: "justify" }), SIREN),
		).toBe(`/avis-cse?siren=${SIREN}`);
	});

	it("returns CSE URL when compliance completed but no CSE opinion", () => {
		expect(
			computeCtaHref(
				makeDeclaration({
					compliancePath: "corrective_action",
					complianceCompletedAt: new Date(),
				}),
				SIREN,
			),
		).toBe(`/avis-cse?siren=${SIREN}`);
	});

	it("returns declaration URL when compliance completed and CSE deposited", () => {
		expect(
			computeCtaHref(
				makeDeclaration({
					compliancePath: "corrective_action",
					complianceCompletedAt: new Date(),
					hasCseOpinion: true,
				}),
				SIREN,
			),
		).toBe(`/declaration-remuneration?siren=${SIREN}`);
	});
});
