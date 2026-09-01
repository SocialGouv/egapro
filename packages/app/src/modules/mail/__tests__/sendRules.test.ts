import { describe, expect, it } from "vitest";

import {
	selectCseOpinionReceiptVariant,
	selectDeclarationConfirmationVariant,
	selectJointEvaluationSubmittedVariant,
} from "../sendRules";

describe("selectDeclarationConfirmationVariant", () => {
	it("returns path_to_select when a path choice is still outstanding", () => {
		expect(
			selectDeclarationConfirmationVariant({
				awaitingPathChoice: true,
				cseRequired: false,
			}),
		).toBe("path_to_select");
	});

	it("returns path_to_select even when a CSE is required (outstanding choice takes priority)", () => {
		expect(
			selectDeclarationConfirmationVariant({
				awaitingPathChoice: true,
				cseRequired: true,
			}),
		).toBe("path_to_select");
	});

	it("returns cse_to_deposit when the path choice is settled but a CSE is required", () => {
		expect(
			selectDeclarationConfirmationVariant({
				awaitingPathChoice: false,
				cseRequired: true,
			}),
		).toBe("cse_to_deposit");
	});

	it("returns completed when the path choice is settled and no CSE is required", () => {
		expect(
			selectDeclarationConfirmationVariant({
				awaitingPathChoice: false,
				cseRequired: false,
			}),
		).toBe("completed");
	});

	// Regression — issue #4293: a compliance path chosen *earlier* (e.g. round
	// 1) must not make a later confirmation e-mail read as "you still need to
	// choose a path". `awaitingPathChoice` reflects the FSM state at the time
	// of this e-mail, not whether a path was ever chosen at any point.
	describe("regression #4293 — a path was chosen earlier but is now settled", () => {
		it("CAS-03/CAS-09 — justify without CSE ends the démarche: completed", () => {
			// Round 1 (CAS-03) or round 2 (CAS-09) just chose "justify", no CSE
			// required: the FSM transitions straight to demarche_completed, so
			// no path choice is outstanding anymore.
			expect(
				selectDeclarationConfirmationVariant({
					awaitingPathChoice: false,
					cseRequired: false,
				}),
			).toBe("completed");
		});

		it("CAS-07 — corrective action resolved without CSE: completed", () => {
			// Round 1 chose "corrective_action" (a path *was* chosen), the
			// second declaration then resolves the gap with no CSE required:
			// terminal state, nothing left to choose.
			expect(
				selectDeclarationConfirmationVariant({
					awaitingPathChoice: false,
					cseRequired: false,
				}),
			).toBe("completed");
		});

		it("CAS-08 — corrective action resolved, CSE opinion expected: cse_to_deposit", () => {
			// Same round-1 choice as CAS-07, but a CSE opinion is still due —
			// the démarche isn't over yet, it's waiting on a deposit, not on a
			// path choice.
			expect(
				selectDeclarationConfirmationVariant({
					awaitingPathChoice: false,
					cseRequired: true,
				}),
			).toBe("cse_to_deposit");
		});
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
