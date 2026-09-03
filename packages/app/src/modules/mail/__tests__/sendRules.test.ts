import { describe, expect, it } from "vitest";

import {
	selectCseOpinionReceiptVariant,
	selectDeclarationConfirmationVariant,
	selectJointEvaluationSubmittedVariant,
} from "../sendRules";

// The selector switches on the FSM status alone — the nine cases below are
// its whole input space (the eight `DECLARATION_FSM_STATUSES` plus `null`).
// `corrective_actions_chosen` and `joint_evaluation_chosen` each get their
// own assertion rather than sharing one with `revised_joint_evaluation_chosen`.
describe("selectDeclarationConfirmationVariant", () => {
	it("returns path_to_select when awaiting the round-1 compliance path choice", () => {
		expect(
			selectDeclarationConfirmationVariant({
				status: "awaiting_compliance_path_choice",
			}),
		).toBe("path_to_select");
	});

	it("returns path_to_select when awaiting the round-2 revision choice", () => {
		expect(
			selectDeclarationConfirmationVariant({
				status: "awaiting_revision_choice",
			}),
		).toBe("path_to_select");
	});

	it("returns path_to_select once corrective actions were chosen and the funnel is still open", () => {
		expect(
			selectDeclarationConfirmationVariant({
				status: "corrective_actions_chosen",
			}),
		).toBe("path_to_select");
	});

	it("returns path_to_select once a joint evaluation was chosen and the funnel is still open", () => {
		expect(
			selectDeclarationConfirmationVariant({
				status: "joint_evaluation_chosen",
			}),
		).toBe("path_to_select");
	});

	it("returns path_to_select once a revised joint evaluation was chosen and the funnel is still open", () => {
		expect(
			selectDeclarationConfirmationVariant({
				status: "revised_joint_evaluation_chosen",
			}),
		).toBe("path_to_select");
	});

	it("returns path_to_select for a draft status", () => {
		expect(selectDeclarationConfirmationVariant({ status: "draft" })).toBe(
			"path_to_select",
		);
	});

	it("returns path_to_select when there is no declaration row at all", () => {
		expect(selectDeclarationConfirmationVariant({ status: null })).toBe(
			"path_to_select",
		);
	});

	it("returns cse_to_deposit when a CSE opinion is awaited", () => {
		expect(
			selectDeclarationConfirmationVariant({ status: "awaiting_cse_opinion" }),
		).toBe("cse_to_deposit");
	});

	it("returns completed once the démarche has ended", () => {
		expect(
			selectDeclarationConfirmationVariant({ status: "demarche_completed" }),
		).toBe("completed");
	});
});

describe("selectJointEvaluationSubmittedVariant", () => {
	it("returns cse_first_and_second when a second declaration exists", () => {
		expect(
			selectJointEvaluationSubmittedVariant({
				hasSecondDeclaration: true,
				cseOpinionExpected: false,
			}),
		).toBe("cse_first_and_second");
	});

	it("returns cse_first_and_second even when a CSE opinion is expected (second declaration takes priority)", () => {
		expect(
			selectJointEvaluationSubmittedVariant({
				hasSecondDeclaration: true,
				cseOpinionExpected: true,
			}),
		).toBe("cse_first_and_second");
	});

	it("returns cse_to_deposit when a CSE opinion is expected without a second declaration", () => {
		expect(
			selectJointEvaluationSubmittedVariant({
				hasSecondDeclaration: false,
				cseOpinionExpected: true,
			}),
		).toBe("cse_to_deposit");
	});

	it("returns completed when there is neither a second declaration nor an expected CSE opinion", () => {
		expect(
			selectJointEvaluationSubmittedVariant({
				hasSecondDeclaration: false,
				cseOpinionExpected: false,
			}),
		).toBe("completed");
	});
});

describe("selectCseOpinionReceiptVariant", () => {
	it("returns first_and_second when the opinion covers both declarations", () => {
		expect(
			selectCseOpinionReceiptVariant({
				forFirstAndSecondDeclaration: true,
				hasGapAboveThreshold: false,
			}),
		).toBe("first_and_second");
	});

	it("returns first_and_second even when the gap is above the threshold (both declarations take priority)", () => {
		expect(
			selectCseOpinionReceiptVariant({
				forFirstAndSecondDeclaration: true,
				hasGapAboveThreshold: true,
			}),
		).toBe("first_and_second");
	});

	it("returns with_gap when the gap is above the threshold for a single declaration", () => {
		expect(
			selectCseOpinionReceiptVariant({
				forFirstAndSecondDeclaration: false,
				hasGapAboveThreshold: true,
			}),
		).toBe("with_gap");
	});

	it("returns single when there is no gap and a single declaration", () => {
		expect(
			selectCseOpinionReceiptVariant({
				forFirstAndSecondDeclaration: false,
				hasGapAboveThreshold: false,
			}),
		).toBe("single");
	});
});
