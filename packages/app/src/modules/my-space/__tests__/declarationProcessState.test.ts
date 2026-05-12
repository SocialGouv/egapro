import { describe, expect, it } from "vitest";

import type { DeclarationFsmStatus } from "~/modules/domain";
import type { PanelVariant } from "../DeclarationProcessPanel";
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
		fsmStatus: "draft",
		currentStep: 6,
		updatedAt: new Date(),
		firstDeclarationPathChoice: null,
		secondDeclarationPathChoice: null,
		secondDeclarationSubmittedAt: null,
		demarcheCompletedAt: null,
		cseOpinionCompletedAt: null,
		cseRequired: false,
		hasJointEvaluationFile: false,
		hasPrefillData: false,
		...overrides,
	};
}

describe("computePanelVariant", () => {
	it('returns "start" when declaration is undefined', () => {
		expect(computePanelVariant(undefined)).toBe("start");
	});

	it('returns "start" when fsmStatus is null', () => {
		expect(computePanelVariant(makeDeclaration({ fsmStatus: null }))).toBe(
			"start",
		);
	});

	const fsmCases: Array<{
		fsm: DeclarationFsmStatus;
		variant: PanelVariant;
		overrides?: Partial<DeclarationItem>;
		label?: string;
	}> = [
		{ fsm: "draft", variant: "start" },
		{ fsm: "awaiting_compliance_path_choice", variant: "compliance_choice" },
		{ fsm: "corrective_actions_chosen", variant: "compliance" },
		{ fsm: "awaiting_revision_choice", variant: "compliance_choice" },
		{ fsm: "joint_evaluation_chosen", variant: "evaluation" },
		{ fsm: "revised_joint_evaluation_chosen", variant: "evaluation" },
		{ fsm: "awaiting_cse_opinion", variant: "cse" },
		{
			fsm: "demarche_completed",
			variant: "cse",
			label: "demarche_completed without CSE opinion deposited",
		},
		{
			fsm: "demarche_completed",
			variant: "closed",
			overrides: { cseOpinionCompletedAt: new Date() },
			label: "demarche_completed with CSE opinion deposited",
		},
	];

	for (const { fsm, variant, overrides, label } of fsmCases) {
		it(`returns "${variant}" for fsmStatus="${fsm}"${label ? ` (${label})` : ""}`, () => {
			expect(
				computePanelVariant(makeDeclaration({ fsmStatus: fsm, ...overrides })),
			).toBe(variant);
		});
	}
});

describe("computeCtaHref", () => {
	it("returns declaration URL when no declaration", () => {
		expect(computeCtaHref(undefined, SIREN)).toBe(
			`/declaration-remuneration?siren=${SIREN}`,
		);
	});

	it("returns declaration URL when fsmStatus is null", () => {
		expect(computeCtaHref(makeDeclaration({ fsmStatus: null }), SIREN)).toBe(
			`/declaration-remuneration?siren=${SIREN}`,
		);
	});

	const fsmCases: Array<{
		fsm: DeclarationFsmStatus;
		href: string;
		overrides?: Partial<DeclarationItem>;
		label?: string;
	}> = [
		{
			fsm: "draft",
			href: `/declaration-remuneration?siren=${SIREN}`,
		},
		{
			fsm: "awaiting_compliance_path_choice",
			href: `/declaration-remuneration/parcours-conformite?siren=${SIREN}`,
		},
		{
			fsm: "awaiting_revision_choice",
			href: `/declaration-remuneration/parcours-conformite?siren=${SIREN}`,
		},
		{
			fsm: "corrective_actions_chosen",
			href: `/declaration-remuneration/parcours-conformite/etape/1?siren=${SIREN}`,
		},
		{
			fsm: "joint_evaluation_chosen",
			href: `/declaration-remuneration/parcours-conformite/evaluation-conjointe?siren=${SIREN}`,
		},
		{
			fsm: "revised_joint_evaluation_chosen",
			href: `/declaration-remuneration/parcours-conformite/evaluation-conjointe?siren=${SIREN}`,
		},
		{
			fsm: "awaiting_cse_opinion",
			href: `/avis-cse?siren=${SIREN}`,
		},
		{
			fsm: "demarche_completed",
			href: `/avis-cse?siren=${SIREN}`,
			label: "demarche_completed without CSE opinion deposited",
		},
		{
			fsm: "demarche_completed",
			href: `/declaration-remuneration?siren=${SIREN}`,
			overrides: { cseOpinionCompletedAt: new Date() },
			label: "demarche_completed with CSE opinion deposited",
		},
	];

	for (const { fsm, href, overrides, label } of fsmCases) {
		it(`returns "${href}" for fsmStatus="${fsm}"${label ? ` (${label})` : ""}`, () => {
			expect(
				computeCtaHref(
					makeDeclaration({ fsmStatus: fsm, ...overrides }),
					SIREN,
				),
			).toBe(href);
		});
	}
});
