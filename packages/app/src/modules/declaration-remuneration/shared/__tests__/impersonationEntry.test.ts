import { describe, expect, it } from "vitest";

import {
	DECLARATION_FSM_STATUSES,
	type DeclarationFsmStatus,
} from "~/modules/domain";
import { getCurrentStageHref } from "~/modules/navigation";
import {
	getImpersonationEntryHref,
	type ImpersonationEntryContext,
} from "../impersonationEntry";

const CORRECTIVE_STEP_1 =
	"/declaration-remuneration/parcours-conformite/etape/1";
const CORRECTIVE_RECAP =
	"/declaration-remuneration/parcours-conformite/etape/3";

function entryFor(
	overrides: Partial<ImpersonationEntryContext> & {
		status: DeclarationFsmStatus;
	},
) {
	return getImpersonationEntryHref({
		currentStep: null,
		secondDeclarationStep: null,
		indicatorGRequired: true,
		cseOpinionRequired: true,
		...overrides,
	});
}

describe("getImpersonationEntryHref — draft resumed", () => {
	it("opens the first step when nothing was saved yet", () => {
		expect(entryFor({ status: "draft", currentStep: null })).toBe(
			"/declaration-remuneration/etape/1",
		);
		expect(entryFor({ status: "draft", currentStep: 0 })).toBe(
			"/declaration-remuneration/etape/1",
		);
	});

	it("opens the step that follows the last saved one", () => {
		expect(entryFor({ status: "draft", currentStep: 3 })).toBe(
			"/declaration-remuneration/etape/4",
		);
	});

	it("skips the indicator G step when it is not required", () => {
		expect(
			entryFor({
				status: "draft",
				currentStep: 4,
				indicatorGRequired: false,
			}),
		).toBe("/declaration-remuneration/etape/6");
	});

	it("stays on the recap once the last step was saved", () => {
		expect(entryFor({ status: "draft", currentStep: 6 })).toBe(
			"/declaration-remuneration/etape/6",
		);
	});
});

describe("getImpersonationEntryHref — corrective actions resumed", () => {
	it("opens the first corrective step while no corrected data is saved", () => {
		expect(
			entryFor({
				status: "corrective_actions_chosen",
				secondDeclarationStep: null,
			}),
		).toBe(CORRECTIVE_STEP_1);
	});

	it("opens the corrective recap once corrected data is saved", () => {
		expect(
			entryFor({
				status: "corrective_actions_chosen",
				secondDeclarationStep: 2,
			}),
		).toBe(CORRECTIVE_RECAP);
	});
});

describe("getImpersonationEntryHref — other stages", () => {
	const otherStatuses = DECLARATION_FSM_STATUSES.filter(
		(status) => status !== "draft" && status !== "corrective_actions_chosen",
	);

	it.each(
		otherStatuses.flatMap((status) => [
			[status, true],
			[status, false],
		]),
	)("sends %s (CSE opinion required: %s) to its current stage", (status, cseOpinionRequired) => {
		expect(
			entryFor({ status, cseOpinionRequired, secondDeclarationStep: 2 }),
		).toBe(getCurrentStageHref(status, cseOpinionRequired));
	});
});
