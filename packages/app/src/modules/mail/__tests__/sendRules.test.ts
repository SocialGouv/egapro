import { describe, expect, it } from "vitest";

import {
	selectCseOpinionReceiptVariant,
	selectDeclarationConfirmationVariant,
	selectJointEvaluationSubmittedVariant,
} from "../sendRules";

describe("selectDeclarationConfirmationVariant", () => {
	it("returns path_to_select when the gap is above the threshold", () => {
		expect(
			selectDeclarationConfirmationVariant({
				hasGapAboveThreshold: true,
				cseRequired: false,
			}),
		).toBe("path_to_select");
	});

	it("returns path_to_select even when a CSE is required (gap takes priority)", () => {
		expect(
			selectDeclarationConfirmationVariant({
				hasGapAboveThreshold: true,
				cseRequired: true,
			}),
		).toBe("path_to_select");
	});

	it("returns cse_to_deposit when there is no gap but a CSE is required", () => {
		expect(
			selectDeclarationConfirmationVariant({
				hasGapAboveThreshold: false,
				cseRequired: true,
			}),
		).toBe("cse_to_deposit");
	});

	it("returns completed when there is no gap and no CSE is required", () => {
		expect(
			selectDeclarationConfirmationVariant({
				hasGapAboveThreshold: false,
				cseRequired: false,
			}),
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
