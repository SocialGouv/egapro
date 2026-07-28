import { describe, expect, it } from "vitest";

import {
	getDeclarationDisplayContext,
	isCseOpinionResolved,
} from "../shared/declarationDisplay";

describe("getDeclarationDisplayContext", () => {
	it("sets shouldShowGapJustification when firstDeclarationPathChoice is justify", () => {
		const result = getDeclarationDisplayContext({
			firstDeclarationPathChoice: "justify",
			secondDeclarationPathChoice: null,
			cseRequired: false,
		});

		expect(result).toEqual({
			firstDeclarationPathChoice: "justify",
			secondDeclarationPathChoice: null,
			shouldShowGapJustification: true,
			shouldShowCorrectiveActions: false,
			shouldShowJointEvaluation: false,
			shouldShowCseOpinion: false,
		});
	});

	it("sets shouldShowCorrectiveActions and shouldShowJointEvaluation when both paths are set", () => {
		const result = getDeclarationDisplayContext({
			firstDeclarationPathChoice: "corrective_action",
			secondDeclarationPathChoice: "joint_evaluation",
			cseRequired: true,
		});

		expect(result).toEqual({
			firstDeclarationPathChoice: "corrective_action",
			secondDeclarationPathChoice: "joint_evaluation",
			shouldShowGapJustification: false,
			shouldShowCorrectiveActions: true,
			shouldShowJointEvaluation: true,
			shouldShowCseOpinion: true,
		});
	});

	it("returns all booleans false when both pathChoices are null and cseRequired is false", () => {
		const result = getDeclarationDisplayContext({
			firstDeclarationPathChoice: null,
			secondDeclarationPathChoice: null,
			cseRequired: false,
		});

		expect(result).toEqual({
			firstDeclarationPathChoice: null,
			secondDeclarationPathChoice: null,
			shouldShowGapJustification: false,
			shouldShowCorrectiveActions: false,
			shouldShowJointEvaluation: false,
			shouldShowCseOpinion: false,
		});
	});

	it("returns shouldShowCseOpinion true when both paths are null but cseRequired is true", () => {
		const result = getDeclarationDisplayContext({
			firstDeclarationPathChoice: null,
			secondDeclarationPathChoice: null,
			cseRequired: true,
		});

		expect(result.shouldShowCseOpinion).toBe(true);
		expect(result.shouldShowGapJustification).toBe(false);
		expect(result.shouldShowCorrectiveActions).toBe(false);
		expect(result.shouldShowJointEvaluation).toBe(false);
	});

	it("sets shouldShowJointEvaluation and shouldShowCseOpinion together when path is joint_evaluation and cseRequired", () => {
		const result = getDeclarationDisplayContext({
			firstDeclarationPathChoice: "joint_evaluation",
			secondDeclarationPathChoice: null,
			cseRequired: true,
		});

		expect(result.shouldShowJointEvaluation).toBe(true);
		expect(result.shouldShowCseOpinion).toBe(true);
		expect(result.shouldShowGapJustification).toBe(false);
		expect(result.shouldShowCorrectiveActions).toBe(false);
	});

	it("sets shouldShowGapJustification when justify is the second path choice", () => {
		const result = getDeclarationDisplayContext({
			firstDeclarationPathChoice: "corrective_action",
			secondDeclarationPathChoice: "justify",
			cseRequired: false,
		});

		expect(result.shouldShowGapJustification).toBe(true);
		expect(result.shouldShowCorrectiveActions).toBe(true);
		expect(result.shouldShowJointEvaluation).toBe(false);
		expect(result.shouldShowCseOpinion).toBe(false);
	});
});

describe("isCseOpinionResolved", () => {
	it("returns true when the CSE opinion is not required", () => {
		expect(
			isCseOpinionResolved({
				cseRequired: false,
				hasSubmittedCseOpinion: false,
			}),
		).toBe(true);
	});

	it("returns true when the CSE opinion has already been submitted", () => {
		expect(
			isCseOpinionResolved({
				cseRequired: true,
				hasSubmittedCseOpinion: true,
			}),
		).toBe(true);
	});

	it("returns false when the CSE opinion is required and not yet submitted", () => {
		expect(
			isCseOpinionResolved({
				cseRequired: true,
				hasSubmittedCseOpinion: false,
			}),
		).toBe(false);
	});

	it("returns true when neither required nor submitted", () => {
		expect(
			isCseOpinionResolved({
				cseRequired: false,
				hasSubmittedCseOpinion: true,
			}),
		).toBe(true);
	});
});
